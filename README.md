# Lojinha D4590

Loja do Rotaract Distrito 4590 com painel de gerenciamento em `/gerenciamento`:
pedidos, vitrines, produtos, imagens, preços, categorias, logo, cores, textos e
contato são todos editáveis pelo painel.

**Fotos do produto** aparecem sempre inteiras, sem corte, qualquer que seja o
formato (a moldura é 4:5, o formato da maioria das fotos da loja). Com o
mouse, a foto aumenta e acompanha o cursor; um
clique (ou toque no celular) abre a tela cheia, com pinça ou toque duplo para
ampliar, arrastar para ver os detalhes e deslizar entre as fotos.

**Carrinho (`/carrinho`)**: o pedido é fechado em 3 etapas, com o resumo
(itens, total, pagamento) sempre ao lado: **Produtos** (tamanho, quantidade,
remover), **Seus dados** (nome, clube, distrito e celular, opcionais e lembrados
neste aparelho) e **Pagamento** (Pix, cartão de crédito ou cartão de débito,
obrigatória). A etapa fica no endereço (`?etapa=dados`, `?etapa=pagamento`), então
o voltar do navegador/celular volta uma etapa. "Finalizar pelo WhatsApp" só
aparece na última etapa: abre a conversa com o pedido já escrito (com a forma de
pagamento) e registra o pedido no painel.

**Pedidos** são registrados quando o visitante finaliza o carrinho. Cada pedido
tem um código (ex.: `#K7P2QX`) que também vai na mensagem do WhatsApp, para
achar a conversa. Nomes e preços vêm do catálogo no servidor (o visitante não
consegue mudar o preço). No painel dá para filtrar por status (Novo,
Confirmado, Entregue, Cancelado), ver quem comprou (nome, clube, distrito e
celular), os detalhes e a forma de pagamento escolhida no carrinho, mudar com
um toque o status, a forma de pagamento (Pix, Cartão de crédito ou Cartão de
débito) e se já foi pago, editar cliente, observações e itens (o total é
recalculado) e excluir.

**Vendas** usa o ano da loja, de **1º de julho a 30 de junho** (ex.: 2026-27 =
1º/07/2026 a 30/06/2027, no horário de Brasília), ou **Total** (todos os anos).
O filtro mostra sozinho todo o histórico e sempre os 3 anos seguintes ao atual.
Sem os pedidos cancelados: total vendido, recebido, a receber, itens vendidos,
cada produto com a quantidade (e os tamanhos) e o valor, e o recebido por forma
de pagamento.

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

> Os testes de navegador montam o site com dados de exemplo na pasta `.next`.
> Antes de um `npm run build` com os dados reais na sua máquina, apague a pasta
> `.next` (ela se refaz sozinha), senão a página inicial pode sair com os
> produtos de exemplo. Na Vercel isso não acontece.

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
| `POST`           | `/api/orders`           | Público — `{ code, paymentMethod, customerName?, customerClub?, customerDistrict?, customerPhone?, items: [{ productId, size?, quantity }] }` (preços vêm do catálogo; limite por visitante) |
| `GET`            | `/api/orders`           | Admin — mais recentes primeiro. `?status=new` filtra    |
| `GET` `PUT` `DELETE` | `/api/orders/:id`   | Admin — `PUT` recebe `{ status, paid, paymentMethod, customerName, customerClub, customerDistrict, customerPhone, notes, items }` e recalcula o total |
| `PATCH`          | `/api/orders/:id`       | Admin — troca rápida: qualquer um de `{ "status": "confirmed", "paid": true, "paymentMethod": "pix" }` |
| `GET` / `PATCH`  | `/api/settings`         | Público / Admin — corpo `{ "<seção>": { …completa } }`  |
| `POST`           | `/api/uploads`          | Admin — `multipart/form-data`, campo `file`, até 5 MB   |
| `POST`           | `/api/auth/login`       | `{ "email", "password" }`                               |
| `POST`           | `/api/auth/logout`      | —                                                       |
| `POST`           | `/api/auth/password`    | Admin — `{ currentPassword, newPassword, confirmPassword }` |

Respostas: `{ "data": … }` ou `{ "error": { "code", "message", "fieldErrors"? } }`.
Seções de configuração: `branding`, `theme`, `hero`, `labels`, `contact`, `footer`.
Status de pedido: `new`, `confirmed`, `delivered`, `canceled`.
Forma de pagamento: `pix`, `credit_card`, `debit_card` (`""` = não informada, só em pedidos antigos); pago: `paid` (true/false).

## Supabase (produção)

1. Aplique as migrations de `supabase/migrations/` em ordem (SQL Editor ou MCP).
   As de pedidos são `20261116120000_orders.sql`,
   `20261116190000_orders_customer_payment.sql` (nome/celular e pagamento) e
   `20261116230000_orders_payment_method_club.sql` (forma de pagamento do
   carrinho, pago/não pago, clube e distrito): sem elas a loja continua
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
  `code`, `items`, `total_in_cents`, `payment_method`, `customer_name`,
  `customer_club`, `customer_district` e `customer_phone` (status, pago e
  observações ficam no padrão). Ler, alterar e excluir é
  só do admin. A API ainda limita quantos pedidos um mesmo visitante envia em
  sequência.
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
