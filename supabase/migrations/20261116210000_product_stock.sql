-- =====================================================================
-- Estoque dos produtos (controle interno; a loja nunca mostra a quantidade)
--
--   * stock: quantidade em estoque.
--   * track_stock: ligado e com stock = 0, o produto sai da loja sozinho e
--     volta quando houver estoque. A leitura pública segue a mesma regra do
--     app (isAvailable): ativo e, se controla estoque, com estoque.
-- =====================================================================

alter table public.products
  add column stock integer not null default 0 check (stock between 0 and 1000000),
  add column track_stock boolean not null default false;

comment on column public.products.stock is
  'Quantidade em estoque (controle interno; a loja não mostra).';
comment on column public.products.track_stock is
  'true: com estoque zerado o produto sai da loja até ser reposto.';

drop policy "products: leitura pública dos ativos" on public.products;
create policy "products: leitura pública dos disponíveis"
  on public.products for select to anon, authenticated
  using ((active and (not track_stock or stock > 0)) or (select private.is_admin()));
