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

insert into public.seller_admin_links (seller_id, admin_id, created_at)
select s.id, a.id, timezone('utc', now())
from public.users s
join public.users a on a.role = 'admin' and a.store_id = s.store_id
where s.role = 'seller'
  and coalesce(s.store_id, '') <> ''
on conflict (seller_id, admin_id) do nothing;

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
    and (
      store_id = public.app_current_user_store_id()
      or public.app_admin_has_seller_access(public.app_current_user_id(), vendedor_id)
    )
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
    and (
      store_id = public.app_current_user_store_id()
      or public.app_admin_has_seller_access(public.app_current_user_id(), vendedor_id)
    )
    and exists (
      select 1
      from public.users u
      where u.id = vendedor_id
        and u.role = 'seller'
        and (
          u.store_id = public.app_current_user_store_id()
          or public.app_admin_has_seller_access(public.app_current_user_id(), u.id)
        )
    )
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
);

create policy vendas_update_policy on public.vendas
for update
using (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
    and (
      store_id = public.app_current_user_store_id()
      or public.app_admin_has_seller_access(public.app_current_user_id(), vendedor_id)
    )
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
    and (
      store_id = public.app_current_user_store_id()
      or public.app_admin_has_seller_access(public.app_current_user_id(), vendedor_id)
    )
    and exists (
      select 1
      from public.users u
      where u.id = vendedor_id
        and u.role = 'seller'
        and (
          u.store_id = public.app_current_user_store_id()
          or public.app_admin_has_seller_access(public.app_current_user_id(), u.id)
        )
    )
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
);

create policy vendas_delete_policy on public.vendas
for delete
using (
  public.app_current_user_role() = 'superadmin'
  or (
    public.app_current_user_role() = 'admin'
    and (
      store_id = public.app_current_user_store_id()
      or public.app_admin_has_seller_access(public.app_current_user_id(), vendedor_id)
    )
  )
  or (
    public.app_current_user_role() = 'seller'
    and vendedor_id = public.app_current_user_id()
  )
);

select
  a.nome as admin,
  a.username as admin_login,
  count(distinct s.id) as vendedores_vinculados,
  count(v.id) as vendas_visiveis_pelo_vinculo
from public.users a
left join public.seller_admin_links sal on sal.admin_id = a.id
left join public.users s on s.id = sal.seller_id
left join public.vendas v on v.vendedor_id = s.id
where a.role = 'admin'
group by a.id, a.nome, a.username
order by a.nome;
