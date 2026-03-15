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

create index if not exists idx_users_username on public.users (username);
create index if not exists idx_vendas_vendedor_id on public.vendas (vendedor_id);
create index if not exists idx_vendas_created_at on public.vendas (created_at desc);

alter table public.users disable row level security;
alter table public.vendas disable row level security;

grant usage on schema public to anon, authenticated;
grant all on table public.users to anon, authenticated;
grant all on table public.vendas to anon, authenticated;

insert into public.users (id, nome, username, password_hash, role, created_at)
values (
  'admin-root',
  'Administrador',
  'admin',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'admin',
  timezone('utc', now())
)
on conflict (id) do update
set
  nome = excluded.nome,
  username = excluded.username,
  password_hash = excluded.password_hash,
  role = excluded.role;
