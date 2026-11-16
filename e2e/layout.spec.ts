import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, seedCart } from "./helpers";

/** Runs on desktop and on a phone (see playwright.config.ts). */
test("páginas da loja não vazam para os lados", async ({ page }) => {
	await seedCart(page, [
		{ productId: "10", name: "Camiseta + Caneca + Tirante + Pin", priceInCents: 8990, quantity: 12, size: "GG" },
		{ productId: "1", name: "Caneca 850mL", priceInCents: 2500, quantity: 1 },
	]);
	for (const path of ["/", "/product/12", "/product/10", "/carrinho"]) {
		await page.goto(path);
		await expect(page.locator("main")).toBeVisible();
		await expectNoHorizontalScroll(page);
	}
	await expect(page.getByRole("complementary", { name: "Resumo do pedido" })).toBeVisible();
});
