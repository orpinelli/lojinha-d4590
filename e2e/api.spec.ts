import { expect, test, type APIRequestContext } from "@playwright/test";
import { findOrder, loginAsAdmin, randomOrderCode } from "./helpers";

/** Each test acts as a different visitor (the order limit is per visitor). */
let visitor = 0;
test.beforeEach(() => {
	visitor += 1;
});
const asVisitor = () => ({ "x-real-ip": `10.30.0.${visitor}` });

const placeOrder = (request: APIRequestContext, data: unknown, headers: Record<string, string> = {}) =>
	request.post("/api/orders", { data, headers: { ...asVisitor(), ...headers } });

test("visitante registra pedido com preços do catálogo e o mesmo código não duplica", async ({ request }) => {
	const code = randomOrderCode();
	const payload = {
		code,
		items: [
			{ productId: "12", size: "G", quantity: 2, unitPriceInCents: 1, name: "preço falso" },
			{ productId: "4", quantity: 1 },
		],
	};
	const first = await placeOrder(request, payload);
	expect(first.status()).toBe(201);
	expect((await first.json()).data).toEqual({ code });
	expect((await placeOrder(request, payload)).status()).toBe(201);

	await loginAsAdmin(request);
	const { data } = (await (await request.get("/api/orders")).json()) as {
		data: { code: string }[];
	};
	const recorded = data.filter((order) => order.code === code);
	expect(recorded).toHaveLength(1);
	expect(recorded[0]).toMatchObject({
		status: "new",
		totalInCents: 13500,
		items: [
			{ productId: "12", name: "Camiseta rosa", size: "G", quantity: 2, unitPriceInCents: 6000 },
			{ productId: "4", name: "Pin", size: "", quantity: 1, unitPriceInCents: 1500 },
		],
	});
});

test("pedidos inválidos são recusados", async ({ request }) => {
	const item = { productId: "1", quantity: 1 };
	expect((await placeOrder(request, { code: "abc", items: [item] })).status()).toBe(422);
	expect((await placeOrder(request, { code: randomOrderCode(), items: [] })).status()).toBe(422);
	expect((await placeOrder(request, { code: randomOrderCode(), items: [{ productId: "1", quantity: 0 }] })).status()).toBe(422);
	expect((await placeOrder(request, { code: randomOrderCode(), items: [{ productId: "nao-existe", quantity: 1 }] })).status()).toBe(422);
	// product 6 is hidden in the store
	expect((await placeOrder(request, { code: randomOrderCode(), items: [{ productId: "6", quantity: 1 }] })).status()).toBe(422);
	const crossSite = await placeOrder(request, { code: randomOrderCode(), items: [item] }, { Origin: "https://site-malicioso.com" });
	expect(crossSite.status()).toBe(403);
	const notJson = await request.post("/api/orders", {
		data: "code=ABCDEF",
		headers: { ...asVisitor(), "Content-Type": "application/x-www-form-urlencoded" },
	});
	expect(notJson.status()).toBe(422);
});

test("um visitante não consegue enviar pedidos sem parar", async ({ request }) => {
	const statuses: number[] = [];
	for (let i = 0; i < 21; i++) {
		statuses.push((await placeOrder(request, { code: randomOrderCode(), items: [] })).status());
	}
	expect(statuses.slice(0, 20).every((status) => status === 422)).toBe(true);
	expect(statuses[20]).toBe(429);
});

test("sem login ninguém lê, altera ou exclui pedidos", async ({ request }) => {
	expect((await request.get("/api/orders")).status()).toBe(401);
	expect((await request.get("/api/orders/qualquer")).status()).toBe(401);
	expect((await request.put("/api/orders/qualquer", { data: {} })).status()).toBe(401);
	expect((await request.patch("/api/orders/qualquer", { data: { status: "confirmed" } })).status()).toBe(401);
	expect((await request.delete("/api/orders/qualquer")).status()).toBe(401);
	const page = await request.get("/gerenciamento/pedidos", { maxRedirects: 0 });
	expect(page.status()).toBe(307);
});

test("admin muda status, edita (total recalculado) e exclui", async ({ request }) => {
	const code = randomOrderCode();
	expect((await placeOrder(request, { code, items: [{ productId: "1", quantity: 1 }] })).status()).toBe(201);
	await loginAsAdmin(request);
	const order = await findOrder(request, code);
	expect(order).toBeDefined();
	const path = `/api/orders/${order?.id}`;

	expect((await request.patch(path, { data: { status: "voando" } })).status()).toBe(422);
	const patched = await request.patch(path, { data: { status: "delivered" } });
	expect((await patched.json()).data.status).toBe("delivered");

	const details = {
		status: "confirmed",
		payment: "unpaid",
		customerName: "João",
		customerPhone: "(19) 99999-8888",
		notes: "",
		items: [{ productId: "1", name: "Caneca 850mL", size: "", quantity: 4, unitPriceInCents: 2000 }],
	};
	const edited = await request.put(path, { data: details });
	expect(edited.status()).toBe(200);
	expect((await edited.json()).data).toMatchObject({
		status: "confirmed",
		payment: "unpaid",
		customerName: "João",
		customerPhone: "5519999998888",
		totalInCents: 8000,
	});
	expect((await request.put(path, { data: { ...details, items: [] } })).status()).toBe(422);
	expect((await request.put(path, { data: { ...details, customerPhone: "123" } })).status()).toBe(422);

	expect((await request.delete(path)).status()).toBe(204);
	expect((await request.get(path)).status()).toBe(404);
	expect((await request.delete(path)).status()).toBe(404);
});

test("rotas que já existiam continuam iguais", async ({ request }) => {
	expect((await request.get("/api/products")).status()).toBe(200);
	expect((await request.get("/api/settings")).status()).toBe(200);
	expect((await request.post("/api/products", { data: {} })).status()).toBe(401);
	expect((await request.patch("/api/settings", { data: {} })).status()).toBe(401);
	expect((await request.post("/api/auth/login", { data: { email: "e2e@local.test", password: "errada" } })).status()).toBe(401);
});

test("nome e celular do carrinho são gravados e o visitante não marca pagamento", async ({ request }) => {
	const code = randomOrderCode();
	const placed = await placeOrder(request, {
		code,
		customerName: "Ana",
		customerPhone: "(11) 91234-5678",
		payment: "pix",
		items: [{ productId: "1", quantity: 1 }],
	});
	expect(placed.status()).toBe(201);
	expect((await placeOrder(request, { code: randomOrderCode(), customerPhone: "123", items: [{ productId: "1", quantity: 1 }] })).status()).toBe(422);

	await loginAsAdmin(request);
	const order = await findOrder(request, code);
	expect(order).toMatchObject({ customerName: "Ana", customerPhone: "5511912345678", payment: "unpaid" });

	const path = `/api/orders/${order?.id}`;
	const paid = await request.patch(path, { data: { payment: "cash" } });
	expect((await paid.json()).data).toMatchObject({ payment: "cash", status: "new" });
	expect((await request.patch(path, { data: { payment: "fiado" } })).status()).toBe(422);
	expect((await request.patch(path, { data: {} })).status()).toBe(422);
});
