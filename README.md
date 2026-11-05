# Lojinha D4590

Loja do Rotaract Distrito 4590 com painel de gerenciamento em `/gerenciamento`:
produtos, imagens, preços, categorias, logo, cores, textos e contato são todos
editáveis pelo painel.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev                  # loja: http://localhost:3000  painel: /gerenciamento
```

`DATA_PROVIDER` escolhe onde os dados ficam:

| Valor      | Uso                                                                 |
| ---------- | ------------------------------------------------------------------- |
| `supabase` | Produção: Postgres + Auth + Storage, protegido por Row Level Security |
| `local`    | Só desenvolvimento: arquivos em `.storage/` (não salva na Vercel)    |

## Arquitetura

```
modules/<módulo>/          Regras de negócio, sem Next.js
  domain/                  Entidades, validação (zod) e portas (interfaces)
  application/             Casos de uso (serviços)
  infrastructure/          Adaptadores: local (arquivos) e Supabase
lib/server/                Raiz de composição (container), HTTP, sessão e consultas
app/api/                   API REST (route handlers)
app/(loja)/                Loja
app/gerenciamento/         Painel
components/ui/             Primitivos (shadcn/Radix)
components/store/          Componentes compostos da loja (ProductCard, SiteHeader, Carousel…)
components/admin/          Componentes compostos do painel (AdminShell, Field, SettingsForm…)
supabase/                  Migrations: schema, RLS, Storage e conteúdo inicial
```

Fluxo: página/API → serviço (`application`) → porta (`domain`) → adaptador
(`infrastructure`). Para trocar o banco, escreva um adaptador novo e registre em
`lib/server/providers.ts`; UI e API não mudam.

Componentes usam **composição** (`<ProductCard.Root>`, `<ProductCard.Price />`…).
As partes interativas ficam em arquivos `"use client"` e o objeto do namespace é
montado em um `index.ts`/`parts.ts` sem diretiva, para funcionar em Server
Components.

## API

| Método           | Rota                    | Acesso                                                  |
| ---------------- | ----------------------- | ------------------------------------------------------- |
| `GET`            | `/api/products`         | Público (ativos). `?includeInactive=true` só admin      |
| `POST`           | `/api/products`         | Admin                                                   |
| `GET`            | `/api/products/:id`     | Público (ativo)                                         |
| `PUT` `DELETE`   | `/api/products/:id`     | Admin                                                   |
| `GET` / `POST`   | `/api/categories`       | Público / Admin                                         |
| `PUT` `DELETE`   | `/api/categories/:id`   | Admin                                                   |
| `GET` / `PATCH`  | `/api/settings`         | Público / Admin — corpo `{ "<seção>": { …completa } }`  |
| `POST`           | `/api/uploads`          | Admin — `multipart/form-data`, campo `file`, até 5 MB   |
| `POST`           | `/api/auth/login`       | `{ "email", "password" }`                               |
| `POST`           | `/api/auth/logout`      | —                                                       |

Respostas: `{ "data": … }` ou `{ "error": { "code", "message", "fieldErrors"? } }`.
Seções de configuração: `branding`, `theme`, `hero`, `labels`, `contact`, `footer`.

## Supabase (produção)

1. Aplique as migrations de `supabase/migrations/` (SQL Editor ou MCP).
2. **Authentication → Users → Add user**: e-mail + senha forte, marque *Auto Confirm User*.
3. Rode `supabase/grant-admin.sql` trocando o e-mail.
4. **Authentication → Sign In / Providers**: desative *Allow new users to sign up*.
5. **Authentication → Attack Protection**: ative *Leaked password protection*.
6. Na Vercel, defina `DATA_PROVIDER=supabase`, `SUPABASE_URL` e
   `SUPABASE_PUBLISHABLE_KEY` (nunca a `service_role`).

## Segurança

- **RLS** em todas as tabelas: visitantes só leem; escrever exige estar em
  `admin_users` (função `private.is_admin()`, fora da API pública).
- O app usa só a chave publicável; a `service_role` nunca entra no código.
- Toda página e rota de admin valida a sessão no servidor; o `proxy.ts` é apenas
  a primeira barreira.
- CSRF: cookie `SameSite=Lax` + checagem de `Origin` + corpo JSON obrigatório.
- Uploads: formato verificado pelos bytes do arquivo (SVG bloqueado), até 5 MB.
- Cabeçalhos: CSP, `X-Frame-Options: DENY`, HSTS, `nosniff`, `Referrer-Policy`.
- Login com limite de tentativas (por IP e global).
