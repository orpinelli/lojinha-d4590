-- =====================================================================
-- Pedidos: registrados quando o visitante toca em "Finalizar pelo WhatsApp"
--
--   * anon (visitantes): só INSERE pedido novo, e só as colunas code,
--     items e total_in_cents (status, cliente e observações ficam no
--     padrão). Não lê nem altera pedidos.
--   * admin: lê, altera e exclui (private.is_admin()).
-- =====================================================================

create table public.orders (
  id text primary key default gen_random_uuid()::text,
  code text not null unique
    check (code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$'),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'delivered', 'canceled')),
  items jsonb not null
    check (
      jsonb_typeof(items) = 'array'
      and jsonb_array_length(items) between 1 and 100
      and pg_column_size(items) < 65536
    ),
  total_in_cents integer not null check (total_in_cents between 0 and 1000000000),
  customer_name text not null default '' check (char_length(customer_name) <= 120),
  customer_phone text not null default '' check (customer_phone ~ '^[0-9]{0,15}$'),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is
  'Pedidos enviados pelo WhatsApp. items guarda nome, tamanho, quantidade e preço de cada produto no momento do pedido; code também vai na mensagem do WhatsApp.';

create index orders_created_at_idx on public.orders (created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function private.set_updated_at();

alter table public.orders enable row level security;

create policy "orders: visitante registra pedido novo"
  on public.orders for insert to anon, authenticated
  with check (status = 'new' and customer_name = '' and customer_phone = '' and notes = '');
create policy "orders: admin lê"
  on public.orders for select to authenticated
  using ((select private.is_admin()));
create policy "orders: admin altera"
  on public.orders for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "orders: admin exclui"
  on public.orders for delete to authenticated
  using ((select private.is_admin()));

-- Privilégio mínimo (segunda barreira além do RLS)
revoke all on public.orders from anon, authenticated;
grant insert (code, items, total_in_cents) on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;
