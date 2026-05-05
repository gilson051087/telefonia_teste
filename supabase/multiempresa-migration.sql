create extension if not exists pgcrypto;

alter table public.users add column if not exists store_id text;
alter table public.vendas add column if not exists store_id text;

create index if not exists idx_users_store_id on public.users (store_id);
create index if not exists idx_vendas_store_id on public.vendas (store_id);

update public.users
set role = 'superadmin', store_id = null
where lower(trim(coalesce(username, ''))) = 'admin';

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
  )
)
where s.role = 'seller'
  and coalesce(s.store_id, '') = '';

update public.vendas v
set store_id = u.store_id,
    payload = jsonb_set(coalesce(v.payload, '{}'::jsonb), '{storeId}', to_jsonb(u.store_id), true)
from public.users u
where v.vendedor_id = u.id
  and coalesce(v.store_id, '') = ''
  and coalesce(u.store_id, '') <> '';
