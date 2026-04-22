create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  nome text not null,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'seller')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vendas (
  id text primary key,
  vendedor_id text,
  vendedor text,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_sessions (
  token text primary key,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null
);

create index if not exists idx_users_username on public.users (username);
create index if not exists idx_vendas_vendedor_id on public.vendas (vendedor_id);
create index if not exists idx_vendas_created_at on public.vendas (created_at desc);
create index if not exists idx_app_sessions_user_id on public.app_sessions (user_id);
create index if not exists idx_app_sessions_expires_at on public.app_sessions (expires_at);

create or replace function public.app_hash_password(p_password text)
returns text
language sql
immutable
as $$
  select encode(digest(coalesce(p_password, ''), 'sha256'), 'hex');
$$;

create or replace function public.app_normalize_username(p_username text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(p_username, '')));
$$;

create or replace function public.app_session_token()
returns text
language sql
stable
as $$
  select nullif((coalesce(current_setting('request.headers', true), '{}')::json ->> 'x-app-session'), '');
$$;

create or replace function public.app_current_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.user_id
  from public.app_sessions s
  where s.token = public.app_session_token()
    and s.expires_at > timezone('utc', now())
  order by s.created_at desc
  limit 1;
$$;

create or replace function public.app_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.id = public.app_current_user_id()
  limit 1;
$$;

create or replace function public.app_current_user_nome()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.nome
  from public.users u
  where u.id = public.app_current_user_id()
  limit 1;
$$;

create or replace function public.app_login(p_username text, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
  v_token text;
  v_expires timestamptz;
begin
  select *
    into v_user
  from public.users
  where username = public.app_normalize_username(p_username)
  limit 1;

  if v_user.id is null or v_user.password_hash <> public.app_hash_password(p_senha) then
    raise exception 'Usuario ou senha invalidos.';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := timezone('utc', now()) + interval '8 hours';

  insert into public.app_sessions (token, user_id, expires_at)
  values (v_token, v_user.id, v_expires);

  delete from public.app_sessions
  where user_id = v_user.id
    and token <> v_token;

  return jsonb_build_object(
    'token', v_token,
    'expiresAt', v_expires,
    'user', jsonb_build_object(
      'id', v_user.id,
      'nome', v_user.nome,
      'username', v_user.username,
      'role', v_user.role,
      'created_at', v_user.created_at
    )
  );
end;
$$;

create or replace function public.app_logout()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.app_sessions where token = public.app_session_token();
end;
$$;

create or replace function public.app_get_session()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
  v_expires timestamptz;
begin
  delete from public.app_sessions where expires_at <= timezone('utc', now());

  select u.*, s.expires_at
    into v_user, v_expires
  from public.app_sessions s
  join public.users u on u.id = s.user_id
  where s.token = public.app_session_token()
    and s.expires_at > timezone('utc', now())
  order by s.created_at desc
  limit 1;

  if v_user.id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  return jsonb_build_object(
    'expiresAt', v_expires,
    'user', jsonb_build_object(
      'id', v_user.id,
      'nome', v_user.nome,
      'username', v_user.username,
      'role', v_user.role,
      'created_at', v_user.created_at
    )
  );
end;
$$;

create or replace function public.app_list_users()
returns table (
  id text,
  nome text,
  username text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text;
  v_user_role text;
begin
  v_user_id := public.app_current_user_id();
  v_user_role := public.app_current_user_role();

  if v_user_id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  if v_user_role = 'admin' then
    return query
      select u.id, u.nome, u.username, u.role, u.created_at
      from public.users u
      order by u.role desc, u.nome asc;
  else
    return query
      select u.id, u.nome, u.username, u.role, u.created_at
      from public.users u
      where u.id = v_user_id;
  end if;
end;
$$;

create or replace function public.app_create_seller(p_nome text, p_username text, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_role text;
  v_nome text;
  v_username text;
  v_new_user public.users%rowtype;
begin
  v_admin_role := public.app_current_user_role();
  if v_admin_role <> 'admin' then
    raise exception 'Acesso restrito ao administrador.';
  end if;

  v_nome := trim(coalesce(p_nome, ''));
  v_username := public.app_normalize_username(p_username);

  if v_nome = '' or v_username = '' or coalesce(p_senha, '') = '' then
    raise exception 'Preencha nome, usuario e senha.';
  end if;

  if length(p_senha) < 6 then
    raise exception 'A senha deve ter pelo menos 6 caracteres.';
  end if;

  if exists(select 1 from public.users where username = v_username) then
    raise exception 'Ja existe um usuario com esse login.';
  end if;

  insert into public.users (id, nome, username, password_hash, role, created_at)
  values (
    encode(gen_random_bytes(16), 'hex'),
    upper(v_nome),
    v_username,
    public.app_hash_password(p_senha),
    'seller',
    timezone('utc', now())
  )
  returning * into v_new_user;

  return jsonb_build_object(
    'id', v_new_user.id,
    'nome', v_new_user.nome,
    'username', v_new_user.username,
    'role', v_new_user.role,
    'created_at', v_new_user.created_at
  );
end;
$$;

create or replace function public.app_delete_seller(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_role text;
  v_target_role text;
begin
  v_admin_role := public.app_current_user_role();
  if v_admin_role <> 'admin' then
    raise exception 'Acesso restrito ao administrador.';
  end if;

  select role into v_target_role from public.users where id = p_id limit 1;

  if v_target_role is null then
    raise exception 'Vendedor nao encontrado.';
  end if;

  if v_target_role = 'admin' then
    raise exception 'Nao e permitido excluir o administrador.';
  end if;

  delete from public.users where id = p_id;
end;
$$;

create or replace function public.app_change_password(p_current_senha text, p_new_senha text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text;
  v_current_hash text;
begin
  v_user_id := public.app_current_user_id();
  if v_user_id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  if coalesce(p_new_senha, '') = '' or length(p_new_senha) < 6 then
    raise exception 'A nova senha deve ter pelo menos 6 caracteres.';
  end if;

  select password_hash into v_current_hash from public.users where id = v_user_id;

  if v_current_hash is null then
    raise exception 'Usuario nao encontrado.';
  end if;

  if v_current_hash <> public.app_hash_password(p_current_senha) then
    raise exception 'Senha atual incorreta.';
  end if;

  update public.users
  set password_hash = public.app_hash_password(p_new_senha)
  where id = v_user_id;
end;
$$;

alter table public.users enable row level security;
alter table public.vendas enable row level security;
alter table public.app_sessions enable row level security;

drop policy if exists vendas_select_policy on public.vendas;
drop policy if exists vendas_insert_policy on public.vendas;
drop policy if exists vendas_update_policy on public.vendas;
drop policy if exists vendas_delete_policy on public.vendas;

create policy vendas_select_policy on public.vendas
for select
using (
  public.app_current_user_role() = 'admin'
  or (
    public.app_current_user_role() = 'seller'
    and (
      vendedor_id = public.app_current_user_id()
      or vendedor = public.app_current_user_nome()
    )
  )
);

create policy vendas_insert_policy on public.vendas
for insert
with check (
  public.app_current_user_role() = 'admin'
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
    and vendedor = public.app_current_user_nome()
  )
);

create policy vendas_update_policy on public.vendas
for update
using (
  public.app_current_user_role() = 'admin'
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
)
with check (
  public.app_current_user_role() = 'admin'
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
    and vendedor = public.app_current_user_nome()
  )
);

create policy vendas_delete_policy on public.vendas
for delete
using (
  public.app_current_user_role() = 'admin'
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
);

grant usage on schema public to anon, authenticated;

revoke all on table public.users from anon, authenticated;
revoke all on table public.vendas from anon, authenticated;
revoke all on table public.app_sessions from anon, authenticated;

grant select, insert, update, delete on table public.vendas to anon, authenticated;

grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_logout() to anon, authenticated;
grant execute on function public.app_get_session() to anon, authenticated;
grant execute on function public.app_list_users() to anon, authenticated;
grant execute on function public.app_create_seller(text, text, text) to anon, authenticated;
grant execute on function public.app_delete_seller(text) to anon, authenticated;
grant execute on function public.app_change_password(text, text) to anon, authenticated;

insert into public.users (id, nome, username, password_hash, role, created_at)
values (
  'admin-root',
  'Administrador',
  'admin',
  public.app_hash_password('123456'),
  'admin',
  timezone('utc', now())
)
on conflict (id) do update
set
  nome = excluded.nome,
  username = excluded.username,
  password_hash = excluded.password_hash,
  role = excluded.role;
