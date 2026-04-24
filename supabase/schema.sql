create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  nome text not null,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('superadmin', 'admin', 'seller')),
  store_id text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.users add column if not exists store_id text;

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('superadmin', 'admin', 'seller'));

update public.users
set store_id = null
where role = 'superadmin';

update public.users
set store_id = id
where role = 'admin'
  and coalesce(store_id, '') = '';

update public.users s
set store_id = coalesce(
  nullif(s.store_id, ''),
  (
    select a.store_id
    from public.users a
    where a.role = 'admin'
      and coalesce(a.store_id, '') <> ''
    order by a.created_at asc
    limit 1
  ),
  s.id
)
where s.role = 'seller';

alter table public.users drop constraint if exists users_store_scope_check;
alter table public.users add constraint users_store_scope_check check (
  (role = 'superadmin' and store_id is null)
  or (role in ('admin', 'seller') and store_id is not null)
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

create table if not exists public.app_goal_targets (
  user_id text not null references public.users(id) on delete cascade,
  cycle_month text not null,
  goal_key text not null,
  goal_value numeric,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by text references public.users(id) on delete set null,
  primary key (user_id, cycle_month, goal_key),
  constraint app_goal_targets_cycle_month_check check (cycle_month ~ '^\d{4}-\d{2}$'),
  constraint app_goal_targets_goal_value_check check (goal_value is null or goal_value >= 0)
);

create table if not exists public.seller_admin_links (
  seller_id text not null references public.users(id) on delete cascade,
  admin_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (seller_id, admin_id)
);

create index if not exists idx_users_username on public.users (username);
create index if not exists idx_users_store_id on public.users (store_id);
create index if not exists idx_vendas_vendedor_id on public.vendas (vendedor_id);
create index if not exists idx_vendas_created_at on public.vendas (created_at desc);
create index if not exists idx_app_sessions_user_id on public.app_sessions (user_id);
create index if not exists idx_app_sessions_expires_at on public.app_sessions (expires_at);
create index if not exists idx_app_goal_targets_user_month on public.app_goal_targets (user_id, cycle_month);
create index if not exists idx_seller_admin_links_admin_id on public.seller_admin_links (admin_id);

insert into public.seller_admin_links (seller_id, admin_id, created_at)
select s.id, a.id, timezone('utc', now())
from public.users s
join public.users a on a.role = 'admin' and a.store_id = s.store_id
where s.role = 'seller'
on conflict (seller_id, admin_id) do nothing;

create or replace function public.app_hash_password(p_password text)
returns text
language sql
immutable
set search_path = public, extensions
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

create or replace function public.app_effective_user_role(p_role text, p_username text)
returns text
language sql
immutable
as $$
  select case
    when lower(trim(coalesce(p_username, ''))) = 'admin' then 'superadmin'
    else lower(trim(coalesce(p_role, '')))
  end;
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
set search_path = public, extensions
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
set search_path = public, extensions
as $$
  select public.app_effective_user_role(u.role, u.username)
  from public.users u
  where u.id = public.app_current_user_id()
  limit 1;
$$;

create or replace function public.app_current_user_store_id()
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select u.store_id
  from public.users u
  where u.id = public.app_current_user_id()
  limit 1;
$$;

create or replace function public.app_current_user_nome()
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select u.nome
  from public.users u
  where u.id = public.app_current_user_id()
  limit 1;
$$;

create or replace function public.app_admin_has_seller_access(p_admin_id text, p_seller_id text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.users s
    where s.id = p_seller_id
      and s.role = 'seller'
      and (
        exists (
          select 1
          from public.seller_admin_links sal
          where sal.seller_id = s.id
            and sal.admin_id = p_admin_id
        )
        or exists (
          -- backward compatibility: when seller has no explicit links yet, keep legacy store-based access.
          select 1
          from public.users a
          where a.id = p_admin_id
            and a.role = 'admin'
            and a.store_id = s.store_id
            and not exists (
              select 1
              from public.seller_admin_links sal_any
              where sal_any.seller_id = s.id
            )
        )
      )
  );
$$;

create or replace function public.app_login(p_senha text, p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
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
      'role', public.app_effective_user_role(v_user.role, v_user.username),
      'created_at', v_user.created_at
    )
  );
end;
$$;

create or replace function public.app_logout()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.app_sessions where token = public.app_session_token();
end;
$$;

create or replace function public.app_get_session()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id text;
  v_nome text;
  v_username text;
  v_role text;
  v_created_at timestamptz;
  v_expires timestamptz;
begin
  delete from public.app_sessions where expires_at <= timezone('utc', now());

  select u.id, u.nome, u.username, u.role, u.created_at, s.expires_at
    into v_id, v_nome, v_username, v_role, v_created_at, v_expires
  from public.app_sessions s
  join public.users u on u.id = s.user_id
  where s.token = public.app_session_token()
    and s.expires_at > timezone('utc', now())
  order by s.created_at desc
  limit 1;

  if v_id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  return jsonb_build_object(
    'expiresAt', v_expires,
    'user', jsonb_build_object(
      'id', v_id,
      'nome', v_nome,
      'username', v_username,
      'role', public.app_effective_user_role(v_role, v_username),
      'created_at', v_created_at
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
set search_path = public, extensions
as $$
declare
  v_user_id text;
  v_user_role text;
  v_user_store_id text;
begin
  v_user_id := public.app_current_user_id();
  v_user_role := public.app_current_user_role();
  v_user_store_id := public.app_current_user_store_id();

  if v_user_id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  if v_user_role = 'superadmin' then
    return query
      select
        u.id,
        u.nome,
        u.username,
        public.app_effective_user_role(u.role, u.username),
        u.created_at
      from public.users u
      order by
        case public.app_effective_user_role(u.role, u.username)
          when 'superadmin' then 0
          when 'admin' then 1
          else 2
        end,
        u.nome asc;
  elsif v_user_role = 'admin' then
    return query
      select
        u.id,
        u.nome,
        u.username,
        public.app_effective_user_role(u.role, u.username),
        u.created_at
      from public.users u
      where u.role = 'seller'
        and public.app_admin_has_seller_access(v_user_id, u.id)
      order by u.nome asc;
  else
    return query
      select
        u.id,
        u.nome,
        u.username,
        public.app_effective_user_role(u.role, u.username),
        u.created_at
      from public.users u
      where u.id = v_user_id;
  end if;
end;
$$;

create or replace function public.app_list_goals()
returns table (
  user_id text,
  cycle_month text,
  goal_key text,
  goal_value numeric
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_requester_id text;
  v_requester_role text;
begin
  v_requester_id := public.app_current_user_id();
  v_requester_role := public.app_current_user_role();

  if v_requester_id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  if v_requester_role = 'superadmin' then
    return query
      select g.user_id, g.cycle_month, g.goal_key, g.goal_value
      from public.app_goal_targets g
      join public.users u on u.id = g.user_id
      where u.role in ('superadmin', 'admin')
      order by g.cycle_month desc, g.user_id asc, g.goal_key asc;
  else
    return query
      select g.user_id, g.cycle_month, g.goal_key, g.goal_value
      from public.app_goal_targets g
      where g.user_id = v_requester_id
      order by g.cycle_month desc, g.goal_key asc;
  end if;
end;
$$;

create or replace function public.app_upsert_goal(
  p_user_id text,
  p_cycle_month text,
  p_goal_key text,
  p_goal_value numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_requester_id text;
  v_requester_role text;
  v_target_role text;
  v_month text;
  v_goal_key text;
begin
  v_requester_id := public.app_current_user_id();
  v_requester_role := public.app_current_user_role();

  if v_requester_id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  v_month := trim(coalesce(p_cycle_month, ''));
  v_goal_key := trim(coalesce(p_goal_key, ''));

  if v_month = '' or v_goal_key = '' or coalesce(p_user_id, '') = '' then
    raise exception 'Parametros de meta invalidos.';
  end if;

  if v_month !~ '^\d{4}-\d{2}$' then
    raise exception 'Mes de competencia invalido.';
  end if;

  if v_goal_key not in ('bandaLarga', 'grossTotal', 'posPagoTitular', 'residencial', 'receita', 'tv') then
    raise exception 'Indicador de meta invalido.';
  end if;

  if p_goal_value is not null and p_goal_value < 0 then
    raise exception 'Valor de meta invalido.';
  end if;

  select role
    into v_target_role
  from public.users
  where id = p_user_id
  limit 1;

  if v_target_role is null then
    raise exception 'Usuario nao encontrado.';
  end if;

  if v_requester_role = 'superadmin' then
    if v_target_role not in ('superadmin', 'admin') then
      raise exception 'Superadmin pode editar metas apenas de administradores.';
    end if;
  elsif v_requester_role in ('admin', 'seller') then
    if p_user_id <> v_requester_id then
      raise exception 'Sem permissao para editar metas de outro usuario.';
    end if;
  else
    raise exception 'Acesso restrito.';
  end if;

  if p_goal_value is null then
    delete from public.app_goal_targets
    where user_id = p_user_id
      and cycle_month = v_month
      and goal_key = v_goal_key;
  else
    insert into public.app_goal_targets (user_id, cycle_month, goal_key, goal_value, created_at, updated_at, updated_by)
    values (p_user_id, v_month, v_goal_key, p_goal_value, timezone('utc', now()), timezone('utc', now()), v_requester_id)
    on conflict (user_id, cycle_month, goal_key)
    do update
      set goal_value = excluded.goal_value,
          updated_at = timezone('utc', now()),
          updated_by = v_requester_id;
  end if;

  return jsonb_build_object(
    'user_id', p_user_id,
    'cycle_month', v_month,
    'goal_key', v_goal_key,
    'goal_value', p_goal_value
  );
end;
$$;

create or replace function public.app_update_user_nome(p_id text, p_nome text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_requester_id text;
  v_requester_role text;
  v_target public.users%rowtype;
  v_old_nome text;
  v_nome text;
begin
  v_requester_id := public.app_current_user_id();
  v_requester_role := public.app_current_user_role();

  if v_requester_id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  if v_requester_role not in ('superadmin', 'admin') then
    raise exception 'Acesso restrito ao administrador.';
  end if;

  v_nome := upper(trim(coalesce(p_nome, '')));
  if v_nome = '' then
    raise exception 'Informe um nome valido.';
  end if;

  select *
    into v_target
  from public.users
  where id = p_id
  limit 1;

  if v_target.id is null then
    raise exception 'Usuario nao encontrado.';
  end if;

  if v_target.role = 'superadmin' and v_requester_role <> 'superadmin' then
    raise exception 'Apenas superadmin pode alterar superadmin.';
  end if;

  if v_requester_role = 'admin' then
    if v_target.id = v_requester_id then
      null;
    elsif v_target.role <> 'seller' then
      raise exception 'Admin pode alterar apenas vendedores vinculados.';
    elsif not public.app_admin_has_seller_access(v_requester_id, v_target.id) then
      raise exception 'Sem permissao para alterar este vendedor.';
    end if;
  end if;

  v_old_nome := v_target.nome;

  update public.users
  set nome = v_nome
  where id = v_target.id
  returning * into v_target;

  update public.vendas
  set
    vendedor = v_nome,
    updated_at = timezone('utc', now())
  where vendedor_id = v_target.id
     or (vendedor_id is null and vendedor = v_old_nome);

  return jsonb_build_object(
    'id', v_target.id,
    'nome', v_target.nome,
    'username', v_target.username,
    'role', v_target.role,
    'created_at', v_target.created_at
  );
end;
$$;

create or replace function public.app_create_seller(p_nome text, p_username text, p_senha text, p_admin_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_requester_id text;
  v_admin_role text;
  v_requester_store_id text;
  v_target_store_id text;
  v_admin_id text;
  v_normalized_admin_ids text[];
  v_nome text;
  v_username text;
  v_new_user public.users%rowtype;
begin
  v_requester_id := public.app_current_user_id();
  v_admin_role := public.app_current_user_role();
  v_requester_store_id := public.app_current_user_store_id();
  if v_admin_role not in ('superadmin', 'admin') then
    raise exception 'Acesso restrito ao administrador.';
  end if;

  if v_requester_id is null then
    raise exception 'Sessao nao encontrada.';
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

  if v_admin_role = 'admin' then
    v_target_store_id := v_requester_store_id;
    v_normalized_admin_ids := array[v_requester_id];
  else
    select array_agg(distinct trim(item))
      into v_normalized_admin_ids
    from unnest(coalesce(p_admin_ids, array[]::text[])) item
    where coalesce(trim(item), '') <> '';

    if coalesce(array_length(v_normalized_admin_ids, 1), 0) = 0 then
      raise exception 'Informe ao menos um administrador responsavel pelo vendedor.';
    end if;

    v_admin_id := v_normalized_admin_ids[1];

    select coalesce(store_id, id)
      into v_target_store_id
    from public.users
    where id = v_admin_id
      and role = 'admin'
    limit 1;

    if coalesce(v_target_store_id, '') = '' then
      raise exception 'Administrador responsavel nao encontrado.';
    end if;

    foreach v_admin_id in array v_normalized_admin_ids loop
      if not exists (
        select 1
        from public.users
        where id = v_admin_id
          and role = 'admin'
      ) then
        raise exception 'Administrador informado nao encontrado.';
      end if;
    end loop;
  end if;

  if coalesce(v_target_store_id, '') = '' then
    raise exception 'Loja do administrador nao encontrada.';
  end if;

  insert into public.users (id, nome, username, password_hash, role, store_id, created_at)
  values (
    encode(gen_random_bytes(16), 'hex'),
    upper(v_nome),
    v_username,
    public.app_hash_password(p_senha),
    'seller',
    v_target_store_id,
    timezone('utc', now())
  )
  returning * into v_new_user;

  if coalesce(array_length(v_normalized_admin_ids, 1), 0) > 0 then
    insert into public.seller_admin_links (seller_id, admin_id, created_at)
    select v_new_user.id, admin_id_item, timezone('utc', now())
    from unnest(v_normalized_admin_ids) admin_id_item
    on conflict (seller_id, admin_id) do nothing;
  end if;

  return jsonb_build_object(
    'id', v_new_user.id,
    'nome', v_new_user.nome,
    'username', v_new_user.username,
    'role', v_new_user.role,
    'created_at', v_new_user.created_at
  );
end;
$$;

create or replace function public.app_create_seller(p_nome text, p_username text, p_senha text, p_admin_id text)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select public.app_create_seller(
    p_nome,
    p_username,
    p_senha,
    case
      when coalesce(trim(p_admin_id), '') = '' then null::text[]
      else array[trim(p_admin_id)]
    end
  );
$$;

create or replace function public.app_create_seller(p_nome text, p_username text, p_senha text)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select public.app_create_seller(p_nome, p_username, p_senha, null::text[]);
$$;

create or replace function public.app_set_seller_admins(p_seller_id text, p_admin_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_requester_id text;
  v_requester_role text;
  v_seller_role text;
  v_primary_admin_store_id text;
  v_admin_id text;
  v_normalized_admin_ids text[];
begin
  v_requester_id := public.app_current_user_id();
  v_requester_role := public.app_current_user_role();

  if v_requester_id is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  if v_requester_role <> 'superadmin' then
    raise exception 'Apenas superadmin pode atualizar os administradores do vendedor.';
  end if;

  select role
    into v_seller_role
  from public.users
  where id = p_seller_id
  limit 1;

  if v_seller_role is null then
    raise exception 'Vendedor nao encontrado.';
  end if;

  if v_seller_role <> 'seller' then
    raise exception 'O usuario informado nao e vendedor.';
  end if;

  select array_agg(distinct trim(item))
    into v_normalized_admin_ids
  from unnest(coalesce(p_admin_ids, array[]::text[])) item
  where coalesce(trim(item), '') <> '';

  if coalesce(array_length(v_normalized_admin_ids, 1), 0) = 0 then
    raise exception 'Informe ao menos um administrador.';
  end if;

  foreach v_admin_id in array v_normalized_admin_ids loop
    if not exists (
      select 1
      from public.users
      where id = v_admin_id
        and role = 'admin'
    ) then
      raise exception 'Administrador informado nao encontrado.';
    end if;
  end loop;

  select coalesce(store_id, id)
    into v_primary_admin_store_id
  from public.users
  where id = v_normalized_admin_ids[1]
    and role = 'admin'
  limit 1;

  if coalesce(v_primary_admin_store_id, '') = '' then
    raise exception 'Administrador principal nao encontrado.';
  end if;

  update public.users
  set store_id = v_primary_admin_store_id
  where id = p_seller_id
    and role = 'seller';

  delete from public.seller_admin_links where seller_id = p_seller_id;

  insert into public.seller_admin_links (seller_id, admin_id, created_at)
  select p_seller_id, admin_id_item, timezone('utc', now())
  from unnest(v_normalized_admin_ids) admin_id_item
  on conflict (seller_id, admin_id) do nothing;

  return jsonb_build_object(
    'seller_id', p_seller_id,
    'admin_ids', v_normalized_admin_ids,
    'primary_admin_store_id', v_primary_admin_store_id
  );
end;
$$;

create or replace function public.app_create_admin(p_nome text, p_username text, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin_role text;
  v_nome text;
  v_username text;
  v_new_user_id text;
  v_new_user public.users%rowtype;
begin
  v_admin_role := public.app_current_user_role();
  if v_admin_role <> 'superadmin' then
    raise exception 'Apenas superadmin pode criar administradores.';
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

  v_new_user_id := encode(gen_random_bytes(16), 'hex');

  insert into public.users (id, nome, username, password_hash, role, store_id, created_at)
  values (
    v_new_user_id,
    upper(v_nome),
    v_username,
    public.app_hash_password(p_senha),
    'admin',
    v_new_user_id,
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
set search_path = public, extensions
as $$
declare
  v_requester_id text;
  v_requester_role text;
  v_target_role text;
begin
  v_requester_id := public.app_current_user_id();
  v_requester_role := public.app_current_user_role();
  if v_requester_role not in ('superadmin', 'admin') then
    raise exception 'Acesso restrito ao administrador.';
  end if;

  select role
    into v_target_role
  from public.users
  where id = p_id
  limit 1;

  if v_target_role is null then
    raise exception 'Usuario nao encontrado.';
  end if;

  if v_target_role = 'superadmin' then
    raise exception 'Nao e permitido excluir superadmin.';
  end if;

  if v_target_role = 'admin' and v_requester_role <> 'superadmin' then
    raise exception 'Apenas superadmin pode excluir administradores.';
  end if;

  if v_requester_role = 'admin' and not public.app_admin_has_seller_access(v_requester_id, p_id) then
    raise exception 'Sem permissao para excluir usuario de outra loja.';
  end if;

  delete from public.users where id = p_id;
end;
$$;

create or replace function public.app_change_password(p_current_senha text, p_new_senha text)
returns void
language plpgsql
security definer
set search_path = public, extensions
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
alter table public.app_goal_targets enable row level security;
alter table public.seller_admin_links enable row level security;

drop policy if exists vendas_select_policy on public.vendas;
drop policy if exists vendas_insert_policy on public.vendas;
drop policy if exists vendas_update_policy on public.vendas;
drop policy if exists vendas_delete_policy on public.vendas;

create policy vendas_select_policy on public.vendas
for select
using (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
);

create policy vendas_insert_policy on public.vendas
for insert
with check (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
    and exists (
      select 1
      from public.users u
      where u.id = vendedor_id
        and u.role = 'seller'
        and u.nome = vendedor
    )
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
    and vendedor = public.app_current_user_nome()
  )
);

create policy vendas_update_policy on public.vendas
for update
using (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
)
with check (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
    and exists (
      select 1
      from public.users u
      where u.id = vendedor_id
        and u.role = 'seller'
        and u.nome = vendedor
    )
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
    and vendedor = public.app_current_user_nome()
  )
);

create policy vendas_delete_policy on public.vendas
for delete
using (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
);

grant usage on schema public to anon, authenticated;

revoke all on table public.users from anon, authenticated;
revoke all on table public.vendas from anon, authenticated;
revoke all on table public.app_sessions from anon, authenticated;
revoke all on table public.app_goal_targets from anon, authenticated;
revoke all on table public.seller_admin_links from anon, authenticated;

grant select, insert, update, delete on table public.vendas to anon, authenticated;

grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_logout() to anon, authenticated;
grant execute on function public.app_get_session() to anon, authenticated;
grant execute on function public.app_admin_has_seller_access(text, text) to anon, authenticated;
grant execute on function public.app_list_users() to anon, authenticated;
grant execute on function public.app_list_goals() to anon, authenticated;
grant execute on function public.app_create_seller(text, text, text) to anon, authenticated;
grant execute on function public.app_create_seller(text, text, text, text) to anon, authenticated;
grant execute on function public.app_create_seller(text, text, text, text[]) to anon, authenticated;
grant execute on function public.app_set_seller_admins(text, text[]) to anon, authenticated;
grant execute on function public.app_create_admin(text, text, text) to anon, authenticated;
grant execute on function public.app_upsert_goal(text, text, text, numeric) to anon, authenticated;
grant execute on function public.app_update_user_nome(text, text) to anon, authenticated;
grant execute on function public.app_delete_seller(text) to anon, authenticated;
grant execute on function public.app_change_password(text, text) to anon, authenticated;

do $$
declare
  v_admin_id text;
begin
  select u.id
    into v_admin_id
  from public.users u
  where lower(trim(coalesce(u.username, ''))) = 'admin'
  order by u.created_at asc
  limit 1;

  if v_admin_id is null then
    insert into public.users (id, nome, username, password_hash, role, store_id, created_at)
    values (
      'admin-root',
      'Administrador',
      'admin',
      public.app_hash_password('123456'),
      'superadmin',
      null,
      timezone('utc', now())
    );
  else
    update public.users
    set
      nome = 'Administrador',
      password_hash = public.app_hash_password('123456'),
      role = 'superadmin',
      store_id = null
    where id = v_admin_id;
  end if;
end $$;
