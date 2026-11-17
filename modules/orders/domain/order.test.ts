/// <reference types="vitest/globals" />
import {
	generateOrderCode,
	isOrderCode,
	ORDER_CODE_LENGTH,
	orderTotal,
	orderUnits,
	paymentMethodLabel,
	paymentSummary,
} from "./order";
import { buildOrderMessage } from "./order-message";
import { checkoutInputSchema, orderDetailsSchema, orderPatchSchema } from "./order-schemas";

describe("customer and payment", () => {
	const items = [{ productId: "1", quantity: 1 }];

	it("cart: name, club, district and phone are optional, phone is normalized", () => {
		expect(checkoutInputSchema.parse({ code: "K7P2QX", paymentMethod: "pix", items })).toMatchObject({
			customerName: "",
			customerClub: "",
			customerDistrict: "",
			customerPhone: "",
		});
		const filled = checkoutInputSchema.parse({
			code: "K7P2QX",
			paymentMethod: "pix",
			items,
			customerName: "  Maria ",
			customerClub: " Rotaract Club Centro ",
			customerDistrict: " 4590 ",
			customerPhone: "(19) 99999-8888",
		});
		expect(filled).toMatchObject({
			customerName: "Maria",
			customerClub: "Rotaract Club Centro",
			customerDistrict: "4590",
			customerPhone: "5519999998888",
		});
		expect(
			checkoutInputSchema.safeParse({ code: "K7P2QX", paymentMethod: "pix", items, customerPhone: "1234" }).success,
		).toBe(false);
	});

	it("cart: the payment method is required, and the visitor can't mark the order as paid", () => {
		expect(checkoutInputSchema.safeParse({ code: "K7P2QX", items }).success).toBe(false);
		expect(checkoutInputSchema.safeParse({ code: "K7P2QX", items, paymentMethod: "cash" }).success).toBe(false);
		expect(checkoutInputSchema.safeParse({ code: "K7P2QX", items, paymentMethod: "" }).success).toBe(false);
		const parsed = checkoutInputSchema.parse({
			code: "K7P2QX",
			items,
			paymentMethod: "debit_card",
			paid: true,
		}) as Record<string, unknown>;
		expect(parsed.paymentMethod).toBe("debit_card");
		expect(parsed.paid).toBeUndefined();
	});

	it("quick change accepts status, paid and/or payment method, never nothing", () => {
		expect(orderPatchSchema.parse({ paid: true })).toEqual({ paid: true });
		expect(orderPatchSchema.parse({ status: "delivered", paymentMethod: "credit_card" })).toEqual({
			status: "delivered",
			paymentMethod: "credit_card",
		});
		expect(orderPatchSchema.safeParse({}).success).toBe(false);
		expect(orderPatchSchema.safeParse({ payment: "pix" }).success).toBe(false);
		expect(orderPatchSchema.safeParse({ paymentMethod: "fiado" }).success).toBe(false);
		expect(orderPatchSchema.safeParse({ paymentMethod: "" }).success).toBe(false);
	});

	it("summarizes the payment for the panel", () => {
		expect(paymentSummary({ paid: false, paymentMethod: "" })).toBe("Não pago");
		expect(paymentSummary({ paid: false, paymentMethod: "pix" })).toBe("Não pago · Pix");
		expect(paymentSummary({ paid: true, paymentMethod: "credit_card" })).toBe("Pago · Cartão de crédito");
		expect(paymentMethodLabel("")).toBe("Não informado");
	});
});

describe("order code", () => {
	it("has 6 easy-to-read characters", () => {
		for (let i = 0; i < 200; i++) {
			const code = generateOrderCode();
			expect(code).toHaveLength(ORDER_CODE_LENGTH);
			expect(isOrderCode(code)).toBe(true);
			expect(code).not.toMatch(/[01OIL]/);
		}
	});

	it("skips bytes that would make some characters more likely", () => {
		// 255 is above the unbiased limit (248) and must be ignored
		const bytes = [255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
		const code = generateOrderCode((size) => Uint8Array.from(bytes.splice(0, size)));
		expect(code).toBe("234567");
	});

	it("rejects anything that isn't a code", () => {
		expect(isOrderCode("K7P2QX")).toBe(true);
		expect(isOrderCode("k7p2qx")).toBe(false);
		expect(isOrderCode("K7P2Q0")).toBe(false);
		expect(isOrderCode("K7P2QXX")).toBe(false);
	});
});

describe("order totals", () => {
	it("sums quantity × unit price and counts units", () => {
		const items = [
			{ quantity: 2, unitPriceInCents: 6000 },
			{ quantity: 1, unitPriceInCents: 2500 },
		];
		expect(orderTotal(items)).toBe(14500);
		expect(orderUnits(items)).toBe(3);
	});
});

describe("order message", () => {
	it("writes the code, the items, the total and the payment method", () => {
		const message = buildOrderMessage({
			code: "K7P2QX",
			greeting: "Olá! Quero pedir:",
			paymentMethod: "debit_card",
			items: [
				{ name: "Camiseta", size: "BABY LOOK G", quantity: 2, priceInCents: 6000 },
				{ name: "Caneca", quantity: 1, priceInCents: 2500 },
			],
		});
		expect(message.replace(/\s/g, " ")).toBe(
			"Olá! Quero pedir:  Pedido #K7P2QX 2x Camiseta (Tamanho: BABY LOOK G) - R$ 60,00 1x Caneca - R$ 25,00  Total: R$ 145,00 Pagamento: Cartão de débito",
		);
	});
});

describe("order schemas", () => {
	it("accepts the cart payload and fills a missing size", () => {
		const parsed = checkoutInputSchema.parse({
			code: "K7P2QX",
			paymentMethod: "pix",
			items: [{ productId: "1", quantity: 2 }],
		});
		expect(parsed.items[0]).toEqual({ productId: "1", size: "", quantity: 2 });
	});

	it("accepts sizes up to 20 characters", () => {
		const withSize = (size: string) =>
			checkoutInputSchema.safeParse({ code: "K7P2QX", paymentMethod: "pix", items: [{ productId: "1", size, quantity: 1 }] });
		expect(withSize("BABY LOOK G").success).toBe(true);
		expect(withSize("X".repeat(20)).success).toBe(true);
		expect(withSize("X".repeat(21)).success).toBe(false);
	});

	it("rejects empty carts and silly quantities", () => {
		expect(checkoutInputSchema.safeParse({ code: "K7P2QX", paymentMethod: "pix", items: [] }).success).toBe(false);
		expect(
			checkoutInputSchema.safeParse({ code: "K7P2QX", paymentMethod: "pix", items: [{ productId: "1", quantity: 0 }] })
				.success,
		).toBe(false);
	});

	it("normalizes the customer phone and validates it only when filled", () => {
		const base = { status: "new", paid: false, paymentMethod: "", customerName: "", customerClub: "", customerDistrict: "", notes: "", items: [
			{ productId: "1", name: "Caneca", size: "", quantity: 1, unitPriceInCents: 2500 },
		] };
		expect(orderDetailsSchema.parse({ ...base, customerPhone: "(19) 99999-8888" }).customerPhone).toBe(
			"5519999998888",
		);
		expect(orderDetailsSchema.parse({ ...base, customerPhone: "" }).customerPhone).toBe("");
		expect(orderDetailsSchema.safeParse({ ...base, customerPhone: "123" }).success).toBe(false);
	});
});
