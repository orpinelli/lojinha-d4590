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
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	const code = (await page.getByText(/^#[0-9A-Z]{6}$/).textContent())?.slice(1) ?? "";
	await expect.poll(() => opened.length).toBe(1);
	expect(whatsappText(opened[0])).toContain(`Pedido #${code}`);

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

	// Details
	await row.getByRole("link", { name: `Pedido #${code}` }).click();
	await expect(page.getByRole("heading", { name: `Pedido #${code}` })).toBeVisible();
	const main = page.locator("main");
	await expect(main).toContainText("Camiseta rosa");
	await expect(main).toContainText("Tamanho M · 2 ×");
	await expect(main).toContainText("R$ 145,00");

	// Quick status change (saved right away)
	const statusGroup = page.getByRole("group", { name: "Status do pedido" });
	await statusGroup.getByRole("button", { name: "Confirmado" }).click();
	await expect(statusGroup.getByRole("button", { name: "Confirmado" })).toHaveAttribute("aria-pressed", "true");
	await expect.poll(async () => (await findOrder(page.request, code))?.status).toBe("confirmed");

	// Edit: customer data and quantity; the total follows
	await page.getByRole("link", { name: "Editar" }).click();
	await expect(page.getByRole("heading", { name: `Editar pedido #${code}` })).toBeVisible();
	await page.getByLabel("Nome", { exact: true }).fill("Maria Teste");
	await page.getByLabel("WhatsApp", { exact: true }).fill("19999998888");
	await page.getByLabel("Observações", { exact: true }).fill("Retira no evento de sábado.");
	await page.getByLabel("Quantidade", { exact: true }).nth(1).fill("3");
	await expect(main).toContainText("R$ 195,00");
	await page.getByRole("button", { name: "Salvar pedido" }).click();

	await expect(page.getByRole("heading", { name: `Pedido #${code}` })).toBeVisible();
	await expect(main).toContainText("Maria Teste");
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
		data: { code: randomOrderCode(), items: [{ productId: "4", quantity: 1 }] },
		headers: { "x-real-ip": "10.20.0.1" },
	});
	await loginAsAdmin(page.request);
	await page.goto("/gerenciamento");
	await page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: "Pedidos" }).click();
	await expect(page).toHaveURL(/\/gerenciamento\/pedidos$/);
	await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();
	await expect(page.getByRole("navigation", { name: "Filtrar pedidos por status" })).toContainText("Todos");
});
