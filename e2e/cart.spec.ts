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

	// Drawers: closed, the items become a one-line summary; they open again
	const itemsDrawer = page.getByRole("button", { name: /^Itens/ });
	await itemsDrawer.click();
	await expect(itemsDrawer).toHaveAttribute("aria-expanded", "false");
	await expect(itemsDrawer).toContainText("2x Camiseta rosa");
	await expect(page.getByRole("button", { name: "Remover Camiseta rosa (tamanho M)" })).toBeHidden();
	await itemsDrawer.click();
	await expect(lines).toHaveCount(1);

	// Confirm: WhatsApp opens with the order written and the cart is emptied
	await expect(summary).toContainText("A escolher");
	await page.getByRole("radio", { name: "Pix" }).check();
	await expect(summary).toContainText("Pix");
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(page.getByRole("heading", { name: "Pedido pronto!" })).toBeVisible();
	await expect(page.locator("main")).toContainText("Pagamento");
	const code = (await page.getByText(/^#[0-9A-Z]{6}$/).textContent())?.slice(1);
	expect(code).toMatch(/^[0-9A-Z]{6}$/);
	await expect.poll(() => opened.length).toBe(1);
	const message = whatsappText(opened[0]);
	expect(message).toContain(`Pedido #${code}`);
	expect(message).toContain("2x Camiseta rosa (Tamanho: M)");
	expect(message).toContain("Total: R$ 120,00");
	expect(message).toContain("Pagamento: Pix");
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

test("a forma de pagamento é obrigatória: Pix, crédito ou débito", async ({ page }) => {
	const opened = await captureWhatsapp(page);
	await seedCart(page, [{ productId: "4", name: "Pin", priceInCents: 1500, quantity: 1 }]);
	await page.goto("/carrinho");
	const methods = page.getByRole("radiogroup", { name: "Forma de pagamento" }).getByRole("radio");
	await expect(methods).toHaveCount(3);
	await expect(methods.nth(0)).toHaveAccessibleName("Pix");
	await expect(methods.nth(1)).toHaveAccessibleName("Cartão de crédito");
	await expect(methods.nth(2)).toHaveAccessibleName("Cartão de débito");

	// Even with its drawer closed, finishing without a method opens it and points there
	const paymentDrawer = page.getByRole("button", { name: /^Forma de pagamento/ });
	await paymentDrawer.click();
	await expect(paymentDrawer).toHaveAttribute("aria-expanded", "false");
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(paymentDrawer).toHaveAttribute("aria-expanded", "true");
	await expect(page.getByText("Escolha a forma de pagamento.")).toBeVisible();
	await expect(page.getByRole("radio", { name: "Pix" })).toBeFocused();
	expect(opened).toHaveLength(0);

	await page.getByRole("radio", { name: "Cartão de crédito" }).check();
	await expect(page.getByText("Escolha a forma de pagamento.")).toHaveCount(0);
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(page.getByRole("heading", { name: "Pedido pronto!" })).toBeVisible();
	await expect.poll(() => opened.length).toBe(1);
	expect(whatsappText(opened[0])).toContain("Pagamento: Cartão de crédito");
});

test("nome, clube, distrito e celular são opcionais, mas o celular preenchido precisa ser válido", async ({ page }) => {
	const opened = await captureWhatsapp(page);
	await seedCart(page, [{ productId: "4", name: "Pin", priceInCents: 1500, quantity: 1 }]);
	await page.goto("/carrinho");
	await page.getByRole("radio", { name: "Cartão de débito" }).check();
	// Optional details start in a closed drawer
	const dataDrawer = page.getByRole("button", { name: /^Seus dados/ });
	await expect(dataDrawer).toHaveAttribute("aria-expanded", "false");
	await dataDrawer.click();
	// Under the name: club, then district
	const fields = page.getByRole("region", { name: /^Seus dados/ }).getByRole("textbox");
	await expect(fields.nth(0)).toHaveAccessibleName("Nome");
	await expect(fields.nth(1)).toHaveAccessibleName("Clube");
	await expect(fields.nth(2)).toHaveAccessibleName("Distrito");
	const phone = page.getByLabel("Celular (WhatsApp)");
	await phone.fill("1999");
	// Closed again: an invalid phone reopens the drawer and focuses the field
	await dataDrawer.click();
	await expect(dataDrawer).toHaveAttribute("aria-expanded", "false");
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(dataDrawer).toHaveAttribute("aria-expanded", "true");
	await expect(page.getByText("Confira o número com DDD, ou deixe em branco.")).toBeVisible();
	await expect(phone).toBeFocused();
	expect(opened).toHaveLength(0);

	await phone.fill("");
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(page.getByRole("heading", { name: "Pedido pronto!" })).toBeVisible();
	await expect.poll(() => opened.length).toBe(1);
});
