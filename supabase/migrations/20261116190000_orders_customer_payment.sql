-- =====================================================================
-- Pedidos: nome e celular do cliente no carrinho (opcionais) e pagamento
--
--   * O visitante agora também pode enviar customer_name e customer_phone.
--     Status, pagamento e observações continuam no padrão (só o admin muda).
--   * payment: 'unpaid' (não pago) ou o meio usado para pagar.
-- =====================================================================

alter table public.orders
  add column payment text not null default 'unpaid'
    check (payment in ('unpaid', 'pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'));

comment on column public.orders.payment is
  'unpaid = ainda não pago; senão, o meio de pagamento (pix, cash, credit_card, debit_card, bank_transfer, other).';

drop policy "orders: visitante registra pedido novo" on public.orders;
create policy "orders: visitante registra pedido novo"
  on public.orders for insert to anon, authenticated
  with check (status = 'new' and payment = 'unpaid' and notes = '');

grant insert (customer_name, customer_phone) on public.orders to anon, authenticated;
