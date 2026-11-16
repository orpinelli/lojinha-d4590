# Lojinha D4590

Loja do Rotaract Distrito 4590 com painel de gerenciamento em `/gerenciamento`:
pedidos, vitrines, produtos, imagens, preços, categorias, logo, cores, textos e
contato são todos editáveis pelo painel.

**Carrinho (`/carrinho`)**: o visitante revisa os itens (tamanho, quantidade,
remover) e o total antes de confirmar. "Finalizar pelo WhatsApp" abre a
conversa com o pedido já escrito e registra o pedido no painel.

**Pedidos** são registrados quando o visitante finaliza o carrinho. Cada pedido
tem um código (ex.: `#K7P2QX`) que também vai na mensagem do WhatsApp, para
achar a conversa. Nomes e preços vêm do catálogo no servidor (o visitante não
consegue mudar o preço). No painel dá para filtrar por status (Novo,
Confirmado, Entregue, Cancelado), ver os detalhes, mudar o status com um
toque, editar cliente, observações e itens (o total é recalculado) e excluir.

**Vitrines** são as seções da página inicial, uma embaixo da outra, na ordem
definida arrastando no painel. Cada vitrine tem título, formato (Carrossel,
Grade ou Destaque — no Destaque o título vira o selo dos cards) e conteúdo:
produtos escolhidos à mão ou uma ou mais categorias juntas. A ordem dos
produtos dentro da vitrine também é definida arrastando, e produtos de uma
categoria podem ser ocultados só naquela vitrine.

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

> Com `DATA_PROVIDER=supabase` no `.env.local`, o que você muda no painel local
> muda a loja de verdade. Para testar sem mexer na loja, use `DATA_PROVIDER=local`.

## Testes

| Comando             | O que verifica                                                         |
| ------------------- | ---------------------------------------------------------------------- |
| `npm run typecheck` | Tipos do TypeScript em todo o projeto                                  |
| `npm test`          | Regras de negócio (carrinho, pedidos, telefone, configurações), sem banco |
| `npm run test:e2e`  | Navegador de verdade: loja, carrinho, pedidos no painel e API, no desktop e no celular |

`npm run test:e2e` faz o build e sobe a loja sozinho em modo local, com dados
temporários e um login de teste descartável (nada toca o Supabase). Usa o
Google Chrome instalado; sem ele, rode `npx playwright install chromium` e
troque `channel: "chrome"` em `playwright.config.ts`.

## Arquitetura

```
modules/<módulo>/          Regras de negócio, sem Next.js
  domain/                  Entidades, validação (zod) e portas (interfaces)
  application/             Casos de uso (serviços)
  infrastructure/          Adaptadores: local (arquivos) e Supabase
lib/server/                Raiz de composição (container), HTTP, sessão e consultas
app/api/                   API REST (route handlers)
app/(loja)/                Loja (inclui /carrinho)
app/gerenciamento/         Painel
components/ui/             Primitivos (shadcn/Radix)
components/store/          Componentes compostos da loja (ProductCard, Cart, SiteHeader…)
components/admin/          Componentes compostos do painel (AdminShell, Field, OrderForm…)
supabase/                  Migrations: schema, RLS, Storage e conteúdo inicial
e2e/                       Testes de navegador (Playwright)
```

Módulos: `catalog` (produtos e categorias), `showcase` (vitrines), `cart`
(carrinho no navegador), `orders` (pedidos), `settings` (aparência e textos),
`media` (imagens), `auth` (login do painel) e `shared` (dinheiro, telefone,
WhatsApp, datas, erros).

Fluxo: página/API → serviço (`application`) → porta (`domain`) → adaptador
(`infrastructure`). Para trocar o banco, escreva um adaptador novo e registre em
`lib/server/providers.ts`; UI e API não mudam.

Componentes usam **composição** (`<ProductCard.Root>`, `<Cart.Summary />`…).
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
| `PUT`            | `/api/categories/order` | Admin — `{ "ids": [...] }` na nova ordem                |
| `GET` / `POST`   | `/api/showcases`        | Público (vitrines da home com produtos) / Admin. `?all=true` só admin |
| `GET` `PUT` `DELETE` | `/api/showcases/:id` | Admin                                                  |
| `PUT`            | `/api/showcases/order`  | Admin — `{ "ids": [...] }` na nova ordem da página      |
| `POST`           | `/api/orders`           | Público — `{ code, items: [{ productId, size?, quantity }] }` (preços vêm do catálogo; limite por visitante) |
| `GET`            | `/api/orders`           | Admin — mais recentes primeiro. `?status=new` filtra    |
| `GET` `PUT` `DELETE` | `/api/orders/:id`   | Admin — `PUT` recebe `{ status, customerName, customerPhone, notes, items }` e recalcula o total |
| `PATCH`          | `/api/orders/:id`       | Admin — só o status: `{ "status": "confirmed" }`        |
| `GET` / `PATCH`  | `/api/settings`         | Público / Admin — corpo `{ "<seção>": { …completa } }`  |
| `POST`           | `/api/uploads`          | Admin — `multipart/form-data`, campo `file`, até 5 MB   |
| `POST`           | `/api/auth/login`       | `{ "email", "password" }`                               |
| `POST`           | `/api/auth/logout`      | —                                                       |
| `POST`           | `/api/auth/password`    | Admin — `{ currentPassword, newPassword, confirmPassword }` |

Respostas: `{ "data": … }` ou `{ "error": { "code", "message", "fieldErrors"? } }`.
Seções de configuração: `branding`, `theme`, `hero`, `labels`, `contact`, `footer`.
Status de pedido: `new`, `confirmed`, `delivered`, `canceled`.

## Supabase (produção)

1. Aplique as migrations de `supabase/migrations/` em ordem (SQL Editor ou MCP).
   A de pedidos é `20261116120000_orders.sql`: sem ela a loja continua
   funcionando, mas os pedidos não são registrados e o painel avisa o que falta.
2. **Authentication → Users → Add user**: e-mail + senha forte, marque *Auto Confirm User*.
3. Rode `supabase/grant-admin.sql` trocando o e-mail.
4. **Authentication → Sign In / Providers**: desative *Allow new users to sign up*.
5. **Authentication → Attack Protection**: ative *Leaked password protection*.
6. Na Vercel, defina `DATA_PROVIDER=supabase`, `SUPABASE_URL` e
   `SUPABASE_PUBLISHABLE_KEY` (nunca a `service_role`).

## Segurança

- **RLS** em todas as tabelas: visitantes só leem o catálogo; escrever exige
  estar em `admin_users` (função `private.is_admin()`, fora da API pública).
- **Pedidos**: o visitante só consegue *inserir* um pedido novo, e só as colunas
  `code`, `items` e `total_in_cents` (status e dados do cliente ficam no
  padrão). Ler, alterar e excluir é só do admin. A API ainda limita quantos
  pedidos um mesmo visitante envia em sequência.
- O app usa só a chave publicável; a `service_role` nunca entra no código.
- Toda página e rota de admin valida a sessão no servidor; o `proxy.ts` é apenas
  a primeira barreira.
- CSRF: cookie `SameSite=Lax` + checagem de `Origin` + corpo JSON obrigatório.
- Uploads: formato verificado pelos bytes do arquivo (SVG bloqueado), até 5 MB.
- Cabeçalhos: CSP, `X-Frame-Options: DENY`, HSTS, `nosniff`, `Referrer-Policy`.
- Login com limite de tentativas (por IP e global); cookie de sessão `HttpOnly`.
- Troca de senha em `/gerenciamento/conta` (exige a senha atual).

## Skills de agentes de IA

`.agents/skills/` e `.claude/skills/` guardam skills usadas por assistentes de
código (Supabase, design de front-end, Hyperframes…), instaladas com
`npx skills add`; a lista e a origem de cada uma ficam em `skills-lock.json`.
`.mcp.json` configura o servidor MCP do Supabase em modo somente leitura.
Os atalhos que o instalador cria em `.aider-desk/` e `data/skills/` apontam
para caminhos da máquina de quem instalou, por isso ficam fora do Git.
