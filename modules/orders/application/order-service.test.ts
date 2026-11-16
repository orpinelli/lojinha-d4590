/// <reference types="vitest/globals" />
import type { Product } from "@/modules/catalog/domain/product";
import type { ProductRepository } from "@/modules/catalog/domain/repositories";
import { ConflictError, NotFoundError, ValidationError } from "@/modules/shared/domain/errors";
import type { Order, OrderRepository } from "../domain/order";
import { createOrderService } from "./order-service";

function product(id: string, name: string, priceInCents: number, active = true): Product {
	return {
		id,
		name,
		priceInCents,
		active,
		stock: 0,
		trackStock: false,
		categoryId: "c",
		description: "",
		images: ["/x.png"],
		sizes: [],
		details: { title: "", items: [] },
		position: 0,
		createdAt: "",
		updatedAt: "",
	};
}

const catalog = [product("1", "Caneca", 2500), product("12", "Camiseta rosa", 6000), product("6", "Adesivo", 200, false)];

function setup() {
	const stored: Order[] = [];
	let clock = 0;
	const orders: OrderRepository = {
		list: async () => [...stored].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
		findById: async (id) => stored.find((order) => order.id === id) ?? null,
		async create(order) {
			if (stored.some((existing) => existing.code === order.code)) throw new ConflictError("código repetido");
			const createdAt = new Date(Date.UTC(2026, 10, 16, 12, clock++)).toISOString();
			stored.push({ ...order, id: `o${stored.length + 1}`, status: "new", payment: "unpaid", notes: "", createdAt, updatedAt: createdAt });
		},
		async update(id, details, totalInCents) {
			const order = stored.find((item) => item.id === id);
			if (!order) return null;
			Object.assign(order, details, { totalInCents });
			return order;
		},
		async patch(id, changes) {
			const order = stored.find((item) => item.id === id);
			if (!order) return null;
			Object.assign(order, changes);
			return order;
		},
		async delete(id) {
			const index = stored.findIndex((order) => order.id === id);
			if (index < 0) return false;
			stored.splice(index, 1);
			return true;
		},
	};
	const products = {
		list: async (filter?: { onlyAvailable?: boolean }) =>
			catalog.filter((item) => !filter?.onlyAvailable || item.active),
	} as unknown as ProductRepository;
	return { stored, service: createOrderService({ orders, products }) };
}

describe("order service", () => {
	it("records the order with names and prices from the catalog", async () => {
		const { stored, service } = setup();
		await service.place({
			code: "K7P2QX",
			items: [
				{ productId: "12", size: "M", quantity: 2, unitPriceInCents: 1, name: "Hack" },
				{ productId: "1", quantity: 1 },
			],
		});
		expect(stored[0]).toMatchObject({
			code: "K7P2QX",
			status: "new",
			totalInCents: 14500,
			items: [
				{ productId: "12", name: "Camiseta rosa", size: "M", quantity: 2, unitPriceInCents: 6000 },
				{ productId: "1", name: "Caneca", size: "", quantity: 1, unitPriceInCents: 2500 },
			],
		});
	});

	it("ignores the same code sent twice (double tap)", async () => {
		const { stored, service } = setup();
		const payload = { code: "K7P2QX", items: [{ productId: "1", quantity: 1 }] };
		await service.place(payload);
		await expect(service.place(payload)).resolves.toEqual({ code: "K7P2QX" });
		expect(stored).toHaveLength(1);
	});

	it("refuses products that are hidden or don't exist", async () => {
		const { service } = setup();
		await expect(
			service.place({ code: "K7P2QX", items: [{ productId: "6", quantity: 1 }] }),
		).rejects.toBeInstanceOf(ValidationError);
		await expect(
			service.place({ code: "K7P2QX", items: [{ productId: "nao-existe", quantity: 1 }] }),
		).rejects.toBeInstanceOf(ValidationError);
	});

	it("lists newest first and counts by status", async () => {
		const { service } = setup();
		await service.place({ code: "AAAAAA", items: [{ productId: "1", quantity: 1 }] });
		await service.place({ code: "BBBBBB", items: [{ productId: "1", quantity: 1 }] });
		const first = await service.overview();
		await service.patch(first.orders[1].id, { status: "delivered" });

		const overview = await service.overview();
		expect(overview.orders.map((order) => order.code)).toEqual(["BBBBBB", "AAAAAA"]);
		expect(overview.counts).toEqual({ new: 1, confirmed: 0, delivered: 1, canceled: 0 });
		expect((await service.overview("delivered")).orders.map((order) => order.code)).toEqual(["AAAAAA"]);
	});

	it("edits customer and items and recalculates the total", async () => {
		const { service } = setup();
		await service.place({ code: "K7P2QX", items: [{ productId: "1", quantity: 1 }] });
		const [order] = (await service.overview()).orders;
		const updated = await service.update(order.id, {
			status: "confirmed",
			payment: "pix",
			customerName: "Maria",
			customerPhone: "(19) 99999-8888",
			notes: "Retira no evento",
			items: [{ productId: "1", name: "Caneca", size: "", quantity: 3, unitPriceInCents: 2000 }],
		});
		expect(updated).toMatchObject({
			status: "confirmed",
			payment: "pix",
			customerName: "Maria",
			customerPhone: "5519999998888",
			totalInCents: 6000,
		});
	});

	it("deletes and reports missing orders", async () => {
		const { service } = setup();
		await service.place({ code: "K7P2QX", items: [{ productId: "1", quantity: 1 }] });
		const [order] = (await service.overview()).orders;
		await service.delete(order.id);
		await expect(service.get(order.id)).rejects.toBeInstanceOf(NotFoundError);
		await expect(service.delete(order.id)).rejects.toBeInstanceOf(NotFoundError);
	});
});
