-- =====================================================================
-- Pedidos: forma de pagamento escolhida no carrinho, clube e distrito
--
--   * payment_method: escolhida pelo cliente no carrinho ('pix',
--     'credit_card' ou 'debit_card'); '' = não informada (pedidos antigos).
--   * paid: marcado pelo admin quando o pagamento chega. Substitui a coluna
--     payment, que juntava as duas coisas ('unpaid' ou o meio usado).
--   * customer_club e customer_district: opcionais, como o nome.
--   * O selo "Frete Grátis" vira "Entrega em eventos ou a combinar".
-- =====================================================================

alter table public.orders
  add column paid boolean not null default false,
  add column payment_method text not null default ''
    check (payment_method in ('', 'pix', 'credit_card', 'debit_card')),
  add column customer_club text not null default ''
    check (char_length(customer_club) <= 120),
  add column customer_district text not null default ''
    check (char_length(customer_district) <= 60);

comment on column public.orders.paid is
  'true quando o pagamento chegou (marcado pelo admin).';
comment on column public.orders.payment_method is
  'Forma escolhida no carrinho: pix, credit_card ou debit_card ('''' = não informada).';
comment on column public.orders.customer_club is 'Clube do cliente (opcional).';
comment on column public.orders.customer_district is 'Distrito do cliente (opcional).';

-- Pedidos antigos: separa "pago" do meio. Dinheiro, transferência e "outro"
-- deixam de existir como forma; ficam anotados nas observações.
-- Sem disparar o gatilho de updated_at: o pedido não foi "alterado" por ninguém.
alter table public.orders disable trigger orders_set_updated_at;

update public.orders set
  paid = payment <> 'unpaid',
  payment_method = case when payment in ('pix', 'credit_card', 'debit_card') then payment else '' end,
  notes = case payment
    when 'cash' then left(concat_ws(E'\n', nullif(notes, ''), 'Pago em dinheiro.'), 1000)
    when 'bank_transfer' then left(concat_ws(E'\n', nullif(notes, ''), 'Pago por transferência.'), 1000)
    when 'other' then left(concat_ws(E'\n', nullif(notes, ''), 'Pago por outro meio.'), 1000)
    else notes
  end;

alter table public.orders enable trigger orders_set_updated_at;

-- O visitante continua sem poder marcar como pago; agora também envia a
-- forma de pagamento, o clube e o distrito.
drop policy "orders: visitante registra pedido novo" on public.orders;
create policy "orders: visitante registra pedido novo"
  on public.orders for insert to anon, authenticated
  with check (status = 'new' and not paid and notes = '');

grant insert (payment_method, customer_club, customer_district) on public.orders to anon, authenticated;

alter table public.orders drop column payment;

-- Selo de entrega ao lado do preço (o texto continua editável no painel).
update public.site_settings
  set data = jsonb_set(data, '{shipping}', to_jsonb('Entrega em eventos ou a combinar'::text))
  where section = 'labels';
