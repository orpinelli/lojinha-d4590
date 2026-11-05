-- =====================================================================
-- Loja D4590 — schema inicial, Row Level Security e Storage
--
-- Modelo de segurança:
--   * anon (visitantes): só LEITURA de categorias, produtos ATIVOS e
--     configurações do site.
--   * authenticated: só escreve se estiver em public.admin_users
--     (checado pela função private.is_admin() em toda policy).
--   * admin_users não tem policy de escrita: só o SQL Editor/service role
--     adiciona ou remove administradores.
-- =====================================================================

-- Funções auxiliares ficam num schema que a Data API não expõe.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Usuários com acesso ao painel /gerenciamento. Gerenciado apenas via SQL Editor ou service role.';

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id text primary key default gen_random_uuid()::text,
  category_id text not null
    references public.categories (id) on update cascade on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  price_in_cents integer not null check (price_in_cents between 0 and 10000000),
  images text[] not null check (cardinality(images) between 1 and 12),
  sizes text[] not null default '{}' check (cardinality(sizes) <= 20),
  details_title text not null default '' check (char_length(details_title) <= 80),
  details_items text[] not null default '{}' check (cardinality(details_items) <= 30),
  featured boolean not null default false,
  active boolean not null default true,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_active_position_idx on public.products (active, position);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Configurações do site (uma linha por seção; a app valida o conteúdo)
-- ---------------------------------------------------------------------
create table public.site_settings (
  section text primary key
    check (section in ('branding', 'theme', 'hero', 'labels', 'contact', 'footer')),
  data jsonb not null
    check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 16384),
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;

-- admin_users: cada usuário só enxerga o próprio registro (sem escrita).
create policy "admin_users: ver o próprio registro"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

-- Leitura pública
create policy "categories: leitura pública"
  on public.categories for select to anon, authenticated
  using (true);

create policy "products: leitura pública dos ativos"
  on public.products for select to anon, authenticated
  using (active or (select private.is_admin()));

create policy "site_settings: leitura pública"
  on public.site_settings for select to anon, authenticated
  using (true);

-- Escrita somente por administradores
create policy "categories: admin insere"
  on public.categories for insert to authenticated
  with check ((select private.is_admin()));
create policy "categories: admin altera"
  on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "categories: admin exclui"
  on public.categories for delete to authenticated
  using ((select private.is_admin()));

create policy "products: admin insere"
  on public.products for insert to authenticated
  with check ((select private.is_admin()));
create policy "products: admin altera"
  on public.products for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "products: admin exclui"
  on public.products for delete to authenticated
  using ((select private.is_admin()));

create policy "site_settings: admin insere"
  on public.site_settings for insert to authenticated
  with check ((select private.is_admin()));
create policy "site_settings: admin altera"
  on public.site_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------
-- Privilégio mínimo (segunda barreira além do RLS)
-- ---------------------------------------------------------------------
revoke all on public.admin_users, public.categories, public.products, public.site_settings
  from anon, authenticated;

grant select on public.categories, public.products, public.site_settings
  to anon, authenticated;
grant insert, update, delete on public.categories, public.products
  to authenticated;
grant insert, update on public.site_settings to authenticated;
grant select on public.admin_users to authenticated;

-- ---------------------------------------------------------------------
-- Storage: imagens públicas, escrita só por administradores
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Bucket público serve os arquivos pela URL pública; listar o bucket pela
-- API exige a policy abaixo (somente admin).
create policy "media: admin lista"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));
create policy "media: admin envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select private.is_admin()));
create policy "media: admin altera"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select private.is_admin()))
  with check (bucket_id = 'media' and (select private.is_admin()));
create policy "media: admin exclui"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));
