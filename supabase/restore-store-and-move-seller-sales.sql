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
    select coalesce(a.store_id, a.id)
    from public.users a
    where a.role = 'admin'
    order by a.created_at asc
    limit 1
  ),
  (
    select coalesce(a.store_id, a.id)
    from public.users a
    where a.role = 'admin'
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

with primary_store as (
  select coalesce(a.store_id, a.id) as store_id
  from public.users a
  where a.role = 'admin'
  order by a.created_at asc
  limit 1
),
target_store as (
  select store_id from primary_store
  limit 1
)
update public.vendas v
set store_id = target_store.store_id,
    payload = jsonb_set(coalesce(v.payload, '{}'::jsonb), '{storeId}', to_jsonb(target_store.store_id), true)
from target_store
where coalesce(v.store_id, '') = ''
  and coalesce(target_store.store_id, '') <> '';

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
    raise exception 'Apenas superadmin pode atualizar a loja do vendedor.';
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
    raise exception 'Informe ao menos uma loja.';
  end if;

  select coalesce(store_id, id)
    into v_primary_admin_store_id
  from public.users
  where id = v_normalized_admin_ids[1]
    and role = 'admin'
  limit 1;

  if coalesce(v_primary_admin_store_id, '') = '' then
    raise exception 'Loja principal nao encontrada.';
  end if;

  foreach v_admin_id in array v_normalized_admin_ids loop
    if not exists (
      select 1
      from public.users
      where id = v_admin_id
        and role = 'admin'
        and coalesce(store_id, '') = v_primary_admin_store_id
    ) then
      raise exception 'Todos os administradores do vendedor precisam pertencer a mesma loja.';
    end if;
  end loop;

  update public.users
  set store_id = v_primary_admin_store_id
  where id = p_seller_id
    and role = 'seller';

  update public.vendas
  set
    store_id = v_primary_admin_store_id,
    payload = jsonb_set(coalesce(payload, '{}'::jsonb), '{storeId}', to_jsonb(v_primary_admin_store_id), true),
    updated_at = timezone('utc', now())
  where vendedor_id = p_seller_id;

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
