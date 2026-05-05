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
    and store_id = public.app_current_user_store_id()
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
    and store_id = public.app_current_user_store_id()
    and exists (
      select 1
      from public.users u
      where u.id = vendedor_id
        and u.role = 'seller'
        and u.store_id = public.app_current_user_store_id()
    )
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
    and store_id = public.app_current_user_store_id()
  )
);

create policy vendas_update_policy on public.vendas
for update
using (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
    and store_id = public.app_current_user_store_id()
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
    and store_id = public.app_current_user_store_id()
    and exists (
      select 1
      from public.users u
      where u.id = vendedor_id
        and u.role = 'seller'
        and u.store_id = public.app_current_user_store_id()
    )
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
    and store_id = public.app_current_user_store_id()
  )
);

create policy vendas_delete_policy on public.vendas
for delete
using (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
    and store_id = public.app_current_user_store_id()
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
);
