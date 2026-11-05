-- =====================================================================
-- Vitrines (seções da página inicial) e ordenação por arrastar
-- =====================================================================

create table public.showcases (
  id text primary key default gen_random_uuid()::text,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  layout text not null default 'carousel'
    check (layout in ('carousel', 'grid', 'featured')),
  source text not null default 'categories'
    check (source in ('products', 'categories')),
  category_ids text[] not null default '{}' check (cardinality(category_ids) <= 20),
  product_ids text[] not null default '{}' check (cardinality(product_ids) <= 200),
  excluded_product_ids text[] not null default '{}'
    check (cardinality(excluded_product_ids) <= 200),
  active boolean not null default true,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.showcases is
  'Seções da página inicial. source=products: product_ids na ordem. source=categories: produtos das categorias; product_ids define a ordem e excluded_product_ids oculta.';

create index showcases_position_idx on public.showcases (position);

create trigger showcases_set_updated_at
  before update on public.showcases
  for each row execute function private.set_updated_at();

alter table public.showcases enable row level security;

create policy "showcases: leitura pública das ativas"
  on public.showcases for select to anon, authenticated
  using (active or (select private.is_admin()));
create policy "showcases: admin insere"
  on public.showcases for insert to authenticated
  with check ((select private.is_admin()));
create policy "showcases: admin altera"
  on public.showcases for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "showcases: admin exclui"
  on public.showcases for delete to authenticated
  using ((select private.is_admin()));

revoke all on public.showcases from anon, authenticated;
grant select on public.showcases to anon, authenticated;
grant insert, update, delete on public.showcases to authenticated;

-- ---------------------------------------------------------------------
-- Reordenação atômica. SECURITY INVOKER: roda com o usuário que chamou,
-- então o RLS continua decidindo (só administradores alteram linhas).
-- ---------------------------------------------------------------------
create or replace function public.reorder_showcases(ids text[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.showcases as s
  set position = o.ord - 1
  from unnest(ids) with ordinality as o(id, ord)
  where s.id = o.id and s.position is distinct from o.ord - 1;
$$;

create or replace function public.reorder_categories(ids text[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.categories as c
  set position = o.ord - 1
  from unnest(ids) with ordinality as o(id, ord)
  where c.id = o.id and c.position is distinct from o.ord - 1;
$$;

revoke all on function public.reorder_showcases(text[]) from public, anon;
revoke all on function public.reorder_categories(text[]) from public, anon;
grant execute on function public.reorder_showcases(text[]) to authenticated;
grant execute on function public.reorder_categories(text[]) to authenticated;

-- ---------------------------------------------------------------------
-- Migração dos dados: o antigo "destaque" e uma vitrine por categoria.
-- ---------------------------------------------------------------------
insert into public.showcases (id, title, layout, source, product_ids, position)
select
  'mais-vendido',
  coalesce(
    nullif(btrim((select data ->> 'featured' from public.site_settings where section = 'labels')), ''),
    'Mais Vendido'
  ),
  'featured',
  'products',
  array_agg(p.id order by p.position, p.name),
  0
from public.products p
where p.featured
having count(*) > 0
on conflict (id) do nothing;

insert into public.showcases (id, title, layout, source, category_ids, position)
select
  c.id,
  c.name,
  case
    when (select count(*) from public.products p where p.category_id = c.id and p.active) > 4
      then 'carousel'
    else 'grid'
  end,
  'categories',
  array[c.id],
  row_number() over (order by c.position, c.name)
from public.categories c
on conflict (id) do nothing;

-- O destaque agora é uma vitrine; o selo usa o título dela.
alter table public.products drop column featured;
update public.site_settings set data = data - 'featured' where section = 'labels';

-- A ordem padrão dos produtos passa a ser global (vitrines refinam por arrastar).
with ordered as (
  select p.id, row_number() over (order by c.position, p.position, p.name) - 1 as new_position
  from public.products p
  join public.categories c on c.id = p.category_id
)
update public.products p
set position = ordered.new_position
from ordered
where p.id = ordered.id;
