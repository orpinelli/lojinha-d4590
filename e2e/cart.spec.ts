import { expect, test, type Page } from "@playwright/test";
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

	// Step 1 has no finish button; the progress bar only lets you go back to steps already seen
	const steps = page.getByRole("navigation", { name: "Etapas do pedido" });
	await expect(steps.getByRole("button")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Finalizar pelo WhatsApp" })).toHaveCount(0);

	// Step 2: the summary keeps the products and the total in sight
	await page.getByRole("button", { name: "Continuar para seus dados" }).click();
	await expect(page).toHaveURL(/\/carrinho\?etapa=dados$/);
	await expect(page.getByRole("heading", { name: /^Seus dados/ })).toBeFocused();
	await expect(summary).toContainText("2x Camiseta rosa (M)");
	await expect(summary).toContainText("R$ 120,00");
	await expect(page.getByRole("button", { name: "Finalizar pelo WhatsApp" })).toHaveCount(0);

	// Step 3: the browser back button returns to the previous step, keeping what was chosen
	await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
	await expect(page).toHaveURL(/\?etapa=pagamento$/);
	await expect(summary).toContainText("A escolher");
	await expect(summary).toContainText("Não informados");
	await page.getByRole("radio", { name: "Pix" }).check();
	await expect(summary).toContainText("Pix");
	await page.goBack();
	await expect(page.getByRole("heading", { name: /^Seus dados/ })).toBeVisible();
	await steps.getByRole("button", { name: /^Pagamento/ }).click();
	await expect(page.getByRole("radio", { name: "Pix" })).toBeChecked();

	// Back to the products from the progress bar, and forward again
	await steps.getByRole("button", { name: /^Produtos/ }).click();
	await expect(lines).toHaveCount(1);
	await steps.getByRole("button", { name: /^Pagamento/ }).click();

	// Confirm: WhatsApp opens with the order written and the cart is emptied
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(page.getByRole("heading", { name: "Pedido pronto!" })).toBeVisible();
	await expect(page).toHaveURL(/\/carrinho$/);
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

/** Goes from the products to the payment step, through the details. */
async function goToPayment(page: Page) {
	await page.getByRole("button", { name: "Continuar para seus dados" }).click();
	await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
	await expect(page.getByRole("heading", { name: "Forma de pagamento" })).toBeVisible();
}

test("a forma de pagamento é obrigatória: Pix, crédito ou débito", async ({ page }) => {
	const opened = await captureWhatsapp(page);
	await seedCart(page, [{ productId: "4", name: "Pin", priceInCents: 1500, quantity: 1 }]);
	await page.goto("/carrinho");
	await goToPayment(page);
	const methods = page.getByRole("radiogroup", { name: "Forma de pagamento" }).getByRole("radio");
	await expect(methods).toHaveCount(3);
	await expect(methods.nth(0)).toHaveAccessibleName("Pix");
	await expect(methods.nth(1)).toHaveAccessibleName("Cartão de crédito");
	await expect(methods.nth(2)).toHaveAccessibleName("Cartão de débito");

	// Finishing without a method points to the choice
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
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
	await page.getByRole("button", { name: "Continuar para seus dados" }).click();
	// Under the name: club, then district
	const fields = page.getByRole("region", { name: /^Seus dados/ }).getByRole("textbox");
	await expect(fields.nth(0)).toHaveAccessibleName("Nome");
	await expect(fields.nth(1)).toHaveAccessibleName("Clube");
	await expect(fields.nth(2)).toHaveAccessibleName("Distrito");

	// An invalid phone keeps the visitor on this step, with the field focused
	const phone = page.getByLabel("Celular (WhatsApp)");
	await phone.fill("1999");
	await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
	await expect(page.getByText("Confira o número com DDD, ou deixe em branco.")).toBeVisible();
	await expect(phone).toBeFocused();
	await expect(page).toHaveURL(/\?etapa=dados$/);

	// Enter in a field continues (the step is a form); everything blank is fine
	await phone.fill("");
	await fields.nth(0).fill("Maria");
	await fields.nth(1).fill("Rotaract Club Centro");
	await fields.nth(0).press("Enter");
	await expect(page.getByRole("heading", { name: "Forma de pagamento" })).toBeVisible();
	const summary = page.getByRole("complementary", { name: "Resumo do pedido" });
	await expect(summary).toContainText("Maria · Rotaract Club Centro");

	await page.getByRole("radio", { name: "Cartão de débito" }).check();
	await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
	await expect(page.getByRole("heading", { name: "Pedido pronto!" })).toBeVisible();
	await expect.poll(() => opened.length).toBe(1);
});
