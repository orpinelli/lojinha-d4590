import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, findOrder, loginAsAdmin, randomOrderCode, seedCart } from "./helpers";

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

test("telas de pedidos do painel não vazam para os lados", async ({ page }) => {
	const code = randomOrderCode();
	await page.request.post("/api/orders", {
		data: {
			code,
			paymentMethod: "credit_card",
			customerClub: "Rotaract Club de Um Nome Bem Comprido Para Testar",
			items: [
				{ productId: "10", size: "BABY LOOK GG EXTRA", quantity: 12 },
				{ productId: "1", quantity: 1 },
			],
		},
		headers: { "x-real-ip": "10.40.0.1" },
	});
	await loginAsAdmin(page.request);
	const order = await findOrder(page.request, code);
	expect(order).toBeDefined();
	for (const path of [
		"/gerenciamento",
		"/gerenciamento/pedidos",
		"/gerenciamento/vendas",
		"/gerenciamento/produtos/10",
		`/gerenciamento/pedidos/${order?.id}`,
		`/gerenciamento/pedidos/${order?.id}/editar`,
	]) {
		await page.goto(path);
		await expect(page.locator("main")).toBeVisible();
		await expectNoHorizontalScroll(page);
	}
});
