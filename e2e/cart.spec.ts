import { expect, test } from "@playwright/test";
import { captureWhatsapp, seedCart, whatsappText } from "./helpers";

test("adiciona produtos, revisa no /carrinho e finaliza pelo WhatsApp", async ({ page }) => {
	const opened = await captureWhatsapp(page);

	// Product with sizes
	await page.goto("/product/12");
	await page.getByRole("combobox", { name: "Tamanho do item 1" }).click();
	await page.getByRole("option", { name: "M", exact: true }).click();
	await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();
	await expect(page.getByText("Produto adicionado", { exact: true })).toBeVisible();

	// Product without size, quantity 2; the notice links to the cart
	await page.goto("/product/1");
	await page.getByRole("button", { name: "Aumentar quantidade" }).click();
	await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();
	await page.getByRole("link", { name: "Ver carrinho", exact: true }).click();

	await expect(page).toHaveURL(/\/carrinho$/);
	await expect(page.getByRole("heading", { name: "Seu carrinho" })).toBeVisible();
	const lines = page.getByRole("list", { name: "Itens do carrinho" }).getByRole("listitem");
	const summary = page.getByRole("complementary", { name: "Resumo do pedido" });
	await expect(lines).toHaveCount(2);
	await expect(summary).toContainText("3 itens");
	await expect(summary).toContainText("R$ 110,00");

	// Review: change quantity and remove a line
	await page.getByRole("button", { name: "Aumentar quantidade de Camiseta rosa" }).click();
	await expect(summary).toContainText("R$ 170,00");
	await page.getByRole("button", { name: "Remover Caneca 850mL" }).click();
	await expect(lines).toHaveCount(1);
	await expect(summary).toContainText("R$ 120,00");

	// Confirm: WhatsApp opens with the order written and the cart is emptied
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(page.getByRole("heading", { name: "Pedido pronto!" })).toBeVisible();
	const code = (await page.getByText(/^#[0-9A-Z]{6}$/).textContent())?.slice(1);
	expect(code).toMatch(/^[0-9A-Z]{6}$/);
	await expect.poll(() => opened.length).toBe(1);
	const message = whatsappText(opened[0]);
	expect(message).toContain(`Pedido #${code}`);
	expect(message).toContain("2x Camiseta rosa (Tamanho: M)");
	expect(message).toContain("Total: R$ 120,00");
	await expect(page.getByRole("link", { name: "Ver carrinho", exact: true })).toBeVisible();

	await page.reload();
	await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
});

test("carrinho vazio leva de volta aos produtos", async ({ page }) => {
	await page.goto("/carrinho");
	await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
	await page.getByRole("link", { name: "Ver produtos" }).first().click();
	await expect(page).toHaveURL(/\/$/);
});

test("o ícone do carrinho mostra a quantidade e abre a página", async ({ page }) => {
	await seedCart(page, [{ productId: "4", name: "Pin", priceInCents: 1500, quantity: 3 }]);
	await page.goto("/");
	await page.getByRole("link", { name: "Ver carrinho (3 itens)" }).click();
	await expect(page).toHaveURL(/\/carrinho$/);
	await expect(page.getByRole("list", { name: "Itens do carrinho" })).toContainText("Pin");
});

test("nome e celular são opcionais, mas o celular preenchido precisa ser válido", async ({ page }) => {
	const opened = await captureWhatsapp(page);
	await seedCart(page, [{ productId: "4", name: "Pin", priceInCents: 1500, quantity: 1 }]);
	await page.goto("/carrinho");
	const phone = page.getByLabel("Celular (WhatsApp)");
	await phone.fill("1999");
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(page.getByText("Confira o número com DDD, ou deixe em branco.")).toBeVisible();
	await expect(phone).toBeFocused();
	expect(opened).toHaveLength(0);

	await phone.fill("");
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(page.getByRole("heading", { name: "Pedido pronto!" })).toBeVisible();
	await expect.poll(() => opened.length).toBe(1);
});
