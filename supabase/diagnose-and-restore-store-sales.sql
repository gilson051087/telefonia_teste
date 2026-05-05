alter table public.users add column if not exists store_id text;
alter table public.vendas add column if not exists store_id text;

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

with primary_store as (
  select coalesce(store_id, id) as store_id
  from public.users
  where role = 'admin'
  order by created_at asc
  limit 1
)
update public.users s
set store_id = primary_store.store_id
from primary_store
where s.role = 'seller'
  and (
    coalesce(s.store_id, '') = ''
    or exists (
      select 1
      from public.vendas v
      where v.vendedor_id = s.id
        and coalesce(v.store_id, '') = ''
    )
  );

update public.vendas v
set store_id = u.store_id,
    payload = jsonb_set(coalesce(v.payload, '{}'::jsonb), '{storeId}', to_jsonb(u.store_id), true)
from public.users u
where v.vendedor_id = u.id
  and coalesce(u.store_id, '') <> ''
  and (
    coalesce(v.store_id, '') = ''
    or v.store_id <> u.store_id
  );

select
  u.id,
  u.nome,
  u.username,
  u.role,
  u.store_id,
  count(v.id) as vendas_vinculadas
from public.users u
left join public.vendas v on v.store_id = coalesce(u.store_id, u.id)
where u.role in ('admin', 'seller')
group by u.id, u.nome, u.username, u.role, u.store_id
order by
  u.role,
  u.nome;
