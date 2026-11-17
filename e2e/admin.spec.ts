import { expect, test } from "@playwright/test";
import {
	captureWhatsapp,
	findOrder,
	loginAsAdmin,
	randomOrderCode,
	seedCart,
	whatsappText,
} from "./helpers";

test("pedido feito na loja aparece no painel e pode ser visto, editado e excluído", async ({ page }) => {
	// Store: the visitor finishes the cart
	const opened = await captureWhatsapp(page);
	await seedCart(page, [
		{ productId: "12", name: "Camiseta rosa", priceInCents: 6000, quantity: 2, size: "M" },
		{ productId: "1", name: "Caneca 850mL", priceInCents: 2500, quantity: 1 },
	]);
	await page.goto("/carrinho");
	await page.getByRole("radio", { name: "Cartão de débito" }).check();
	await page.getByLabel("Clube", { exact: true }).fill("Rotaract Club Teste");
	await page.getByLabel("Distrito", { exact: true }).fill("4590");
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	const code = (await page.getByText(/^#[0-9A-Z]{6}$/).textContent())?.slice(1) ?? "";
	await expect.poll(() => opened.length).toBe(1);
	expect(whatsappText(opened[0])).toContain(`Pedido #${code}`);
	expect(whatsappText(opened[0])).toContain("Pagamento: Cartão de débito");

	// Admin: the order was recorded in the background
	await loginAsAdmin(page.request);
	await expect.poll(async () => (await findOrder(page.request, code))?.status).toBe("new");

	await page.goto("/gerenciamento");
	await expect(page.getByRole("link", { name: /pedidos? novos?/ })).toBeVisible();

	await page.goto("/gerenciamento/pedidos");
	const row = page.getByRole("listitem").filter({ hasText: `Pedido #${code}` });
	await expect(row).toContainText("Novo");
	await expect(row).toContainText("3 itens");
	await expect(row).toContainText("R$ 145,00");
	await expect(row).toContainText("Não pago · Cartão de débito");

	// Details
	await row.getByRole("link", { name: `Pedido #${code}` }).click();
	await expect(page.getByRole("heading", { name: `Pedido #${code}` })).toBeVisible();
	const main = page.locator("main");
	await expect(main).toContainText("Camiseta rosa");
	await expect(main).toContainText("Tamanho M · 2 ×");
	await expect(main).toContainText("R$ 145,00");
	await expect(main).toContainText("Rotaract Club Teste");
	await expect(main).toContainText("4590");

	// Quick status change (saved right away)
	const statusGroup = page.getByRole("group", { name: "Status do pedido" });
	await statusGroup.getByRole("button", { name: "Confirmado" }).click();
	await expect(statusGroup.getByRole("button", { name: "Confirmado" })).toHaveAttribute("aria-pressed", "true");
	await expect.poll(async () => (await findOrder(page.request, code))?.status).toBe("confirmed");

	// Payment: the method chosen in the cart shows up and can be changed; paid is separate
	await expect(page.getByText("Não pago · Cartão de débito").first()).toBeVisible();
	const methodGroup = page.getByRole("group", { name: "Forma de pagamento" });
	await expect(methodGroup.getByRole("button")).toHaveText(["Pix", "Cartão de crédito", "Cartão de débito"]);
	await expect(methodGroup.getByRole("button", { name: "Cartão de débito" })).toHaveAttribute("aria-pressed", "true");
	await methodGroup.getByRole("button", { name: "Pix" }).click();
	await expect(methodGroup.getByRole("button", { name: "Pix" })).toHaveAttribute("aria-pressed", "true");
	await expect(page.getByText("Não pago · Pix").first()).toBeVisible();
	const paidGroup = page.getByRole("group", { name: "Situação do pagamento" });
	await paidGroup.getByRole("button", { name: "Pago", exact: true }).click();
	await expect(paidGroup.getByRole("button", { name: "Pago", exact: true })).toHaveAttribute("aria-pressed", "true");
	await expect(page.getByText("Pago · Pix").first()).toBeVisible();

	// Edit: customer data and quantity; the total follows
	await page.getByRole("link", { name: "Editar" }).click();
	await expect(page.getByRole("heading", { name: `Editar pedido #${code}` })).toBeVisible();
	await expect(page.getByRole("radio", { name: "Pix" })).toBeChecked();
	await expect(page.getByRole("switch", { name: "Pago" })).toBeChecked();
	await expect(page.getByLabel("Clube", { exact: true })).toHaveValue("Rotaract Club Teste");
	await page.getByLabel("Nome", { exact: true }).fill("Maria Teste");
	await page.getByLabel("Distrito", { exact: true }).fill("4591");
	await page.getByLabel("WhatsApp", { exact: true }).fill("19999998888");
	await page.getByLabel("Observações", { exact: true }).fill("Retira no evento de sábado.");
	await page.getByLabel("Quantidade", { exact: true }).nth(1).fill("3");
	await expect(main).toContainText("R$ 195,00");
	await page.getByRole("button", { name: "Salvar pedido" }).click();

	await expect(page.getByRole("heading", { name: `Pedido #${code}` })).toBeVisible();
	await expect(main).toContainText("Maria Teste");
	await expect(main).toContainText("4591");
	await expect(main).toContainText("+55 19 99999-8888");
	await expect(main).toContainText("Retira no evento de sábado.");
	await expect(main).toContainText("R$ 195,00");

	// Filters
	await page.goto("/gerenciamento/pedidos?status=confirmed");
	await expect(page.getByRole("listitem").filter({ hasText: `Pedido #${code}` })).toBeVisible();
	await page.goto("/gerenciamento/pedidos?status=new");
	await expect(page.getByRole("listitem").filter({ hasText: `Pedido #${code}` })).toHaveCount(0);

	// Delete (with confirmation)
	await page.goto("/gerenciamento/pedidos");
	await page.getByRole("listitem").filter({ hasText: `Pedido #${code}` }).getByRole("link", { name: "Ver" }).click();
	await page.getByRole("button", { name: "Excluir" }).click();
	await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
	await expect(page).toHaveURL(/\/gerenciamento\/pedidos$/);
	await expect(page.getByRole("listitem").filter({ hasText: `Pedido #${code}` })).toHaveCount(0);
	expect(await findOrder(page.request, code)).toBeUndefined();
});

test("menu do painel leva aos pedidos", async ({ page }) => {
	await page.request.post("/api/orders", {
		data: { code: randomOrderCode(), paymentMethod: "pix", items: [{ productId: "4", quantity: 1 }] },
		headers: { "x-real-ip": "10.20.0.1" },
	});
	await loginAsAdmin(page.request);
	await page.goto("/gerenciamento");
	await page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: "Pedidos" }).click();
	await expect(page).toHaveURL(/\/gerenciamento\/pedidos$/);
	await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();
	await expect(page.getByRole("navigation", { name: "Filtrar pedidos por status" })).toContainText("Todos");
});

test("forma de pagamento, nome e celular informados no carrinho aparecem no painel", async ({ page }) => {
	await captureWhatsapp(page);
	await seedCart(page, [{ productId: "9", name: "Caneca + Tirante + Pin", priceInCents: 4200, quantity: 5 }]);
	await page.goto("/carrinho");
	await page.getByRole("radio", { name: "Pix" }).check();
	await page.getByLabel("Nome", { exact: true }).fill("Gabriel Teste");
	await page.getByLabel("Celular (WhatsApp)").fill("19 98888-7777");
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	const code = (await page.getByText(/^#[0-9A-Z]{6}$/).textContent())?.slice(1) ?? "";

	await loginAsAdmin(page.request);
	await expect.poll(async () => (await findOrder(page.request, code))?.status).toBe("new");
	await page.goto("/gerenciamento/pedidos");
	const row = page.getByRole("listitem").filter({ hasText: `Pedido #${code}` });
	await expect(row).toContainText("Gabriel Teste");
	await expect(row).toContainText("+55 19 98888-7777");
	await expect(row).toContainText("5 itens");
	await expect(row).toContainText("Não pago · Pix");
});

test("vendas do ano: quantidade e valor de cada produto, sem os cancelados", async ({ page }) => {
	await loginAsAdmin(page.request);
	const place = async (quantity: number) => {
		const code = randomOrderCode();
		const response = await page.request.post("/api/orders", {
			data: { code, paymentMethod: "pix", items: [{ productId: "5", quantity }] },
			headers: { "x-real-ip": "10.60.0.1" },
		});
		expect(response.status()).toBe(201);
		const order = await findOrder(page.request, code);
		expect(order).toBeDefined();
		return order!;
	};
	const paid = await place(3);
	await place(2);
	const canceled = await place(4);
	await page.request.patch(`/api/orders/${paid.id}`, { data: { paid: true } });
	await page.request.patch(`/api/orders/${canceled.id}`, { data: { status: "canceled" } });

	await page.goto("/gerenciamento");
	await page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: "Vendas" }).click();
	// Store year: July → June (e.g. 2026-27), the current one first
	await expect(page.getByRole("heading", { name: /^Vendas de \d{4}-\d{2}$/ })).toBeVisible();
	await expect(page.locator("main")).toContainText(/De 1º de julho de \d{4} a 30 de junho de \d{4}/);
	const tirante = page
		.getByRole("list", { name: "Produtos vendidos" })
		.getByRole("listitem")
		.filter({ has: page.getByText("Tirante", { exact: true }) });
	await expect(tirante).toContainText(/5\s*unidades/);
	await expect(tirante).toContainText("R$ 60,00");
	await expect(page.getByRole("list", { name: "Recebido por meio de pagamento" })).toContainText("Pix");
	await expect(page.locator("main")).toContainText(/cancelados? fic/);

	// Filter: Total + the current year and the next 3, always
	const filter = page.getByRole("navigation", { name: "Escolher o período" });
	const yearLinks = filter.getByRole("link", { name: /^\d{4}-\d{2}$/ });
	expect(await yearLinks.count()).toBeGreaterThanOrEqual(4);
	await filter.getByRole("link", { name: "Total" }).click();
	await expect(page.getByRole("heading", { name: "Vendas de todos os anos" })).toBeVisible();
	await expect(tirante).toContainText(/5\s*unidades/);
	await yearLinks.last().click();
	await expect(page.getByText(/^Nenhuma venda em \d{4}-\d{2}$/)).toBeVisible();
});

test("busca de pedidos por nome, número e celular enquanto digita", async ({ page }) => {
	await loginAsAdmin(page.request);
	const place = async (customerName: string, customerPhone: string) => {
		const code = randomOrderCode();
		const response = await page.request.post("/api/orders", {
			data: { code, paymentMethod: "pix", customerName, customerPhone, items: [{ productId: "4", quantity: 1 }] },
			headers: { "x-real-ip": "10.80.0.1" },
		});
		expect(response.status()).toBe(201);
		return code;
	};
	const ana = await place("Ana Busca Teste", "11 98765-4321");
	const bruno = await place("Bruno Busca Teste", "");

	await page.goto("/gerenciamento/pedidos");
	const search = page.getByRole("textbox", { name: "Buscar pedidos" });
	const rows = page.getByRole("list", { name: "Pedidos" }).getByRole("listitem");

	await search.fill("ana busca");
	await expect(rows).toHaveCount(1);
	await expect(rows.first()).toContainText(`Pedido #${ana}`);
	await expect(page.getByText(/^1 de \d+ pedidos$/)).toBeVisible();

	await search.fill(`#${bruno.slice(0, 4).toLowerCase()}`);
	await expect(rows.first()).toContainText("Bruno Busca Teste");

	await search.fill("(11) 98765-4321");
	await expect(rows).toHaveCount(1);
	await expect(rows.first()).toContainText(`Pedido #${ana}`);

	await search.fill("ninguém com esse nome");
	await expect(page.getByText(/^Nenhum pedido encontrado para/)).toBeVisible();

	// The search goes to the URL: it survives a reload and the status tabs
	await search.fill("bruno busca");
	await expect(page).toHaveURL(/busca=bruno/);
	await page.reload();
	await expect(search).toHaveValue("bruno busca");
	await expect(rows).toHaveCount(1);
	await page.getByRole("navigation", { name: "Filtrar pedidos por status" }).getByRole("link", { name: /^Novos/ }).click();
	await expect(page).toHaveURL(/status=new.*busca=bruno/);
	await expect(rows).toHaveCount(1);

	// Esc clears
	await search.press("Escape");
	await expect(search).toHaveValue("");
	expect(await rows.count()).toBeGreaterThan(1);
});

test("estoque: com o controle ligado e estoque zero o produto sai da loja; repor traz de volta", async ({ page }) => {
	await loginAsAdmin(page.request);
	const form = "/gerenciamento/produtos/8"; // "Caneca + tirante" (seed)

	await page.goto(form);
	await expect(page.getByText("Na loja", { exact: true })).toBeVisible();
	const stock = page.getByLabel("Estoque", { exact: true });
	await page.getByRole("button", { name: "Aumentar estoque" }).click();
	await page.getByRole("button", { name: "Aumentar estoque" }).click();
	await expect(stock).toHaveValue("2");
	await page.getByRole("switch", { name: "Controlar estoque" }).click();
	await expect(page.getByText("Na loja", { exact: true })).toBeVisible();
	await stock.fill("0");
	await expect(page.getByText("Sem estoque", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Salvar alterações" }).click();
	await expect(page).toHaveURL(/\/gerenciamento\/produtos$/);
	const row = page.getByRole("listitem").filter({ has: page.getByText("Caneca + tirante", { exact: true }) });
	await expect(row).toContainText("Sem estoque");

	// The store no longer shows it (page, list and checkout)
	expect((await page.request.get("/product/8")).status()).toBe(404);
	const listed = (await (await page.request.get("/api/products")).json()) as { data: { id: string }[] };
	expect(listed.data.some((item) => item.id === "8")).toBe(false);

	// Restock: it comes back by itself
	await page.goto(form);
	await page.getByRole("button", { name: "Aumentar estoque" }).click();
	await expect(page.getByText("Na loja", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Salvar alterações" }).click();
	await expect(page).toHaveURL(/\/gerenciamento\/produtos$/);
	expect((await page.request.get("/product/8")).status()).toBe(200);
	await expect(row).toContainText("Estoque: 1");
});
