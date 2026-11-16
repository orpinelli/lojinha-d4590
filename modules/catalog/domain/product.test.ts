/// <reference types="vitest/globals" />
import { productInputSchema } from "./catalog-schemas";
import { isAvailable, productAvailability, toStoreProduct, type Product } from "./product";

const product: Product = {
	id: "1",
	name: "Caneca",
	description: "",
	priceInCents: 2500,
	categoryId: "c",
	images: ["/caneca.png"],
	sizes: [],
	details: { title: "", items: [] },
	active: true,
	stock: 0,
	trackStock: false,
	position: 0,
	createdAt: "",
	updatedAt: "",
};

describe("product availability", () => {
	it("stock at zero only matters when stock is controlled", () => {
		expect(productAvailability(product)).toBe("available");
		expect(productAvailability({ ...product, trackStock: true })).toBe("out-of-stock");
		expect(productAvailability({ ...product, trackStock: true, stock: 3 })).toBe("available");
	});

	it("an inactive product is never in the store", () => {
		expect(productAvailability({ ...product, active: false, stock: 10 })).toBe("inactive");
		expect(isAvailable({ ...product, active: false })).toBe(false);
	});

	it("the store never receives the stock", () => {
		const forStore = toStoreProduct({ ...product, stock: 7, trackStock: true }) as Record<string, unknown>;
		expect(forStore.stock).toBeUndefined();
		expect(forStore.trackStock).toBeUndefined();
		expect(forStore.name).toBe("Caneca");
	});

	it("stock is a whole number, zero or more", () => {
		const { id: _id, position: _position, createdAt: _c, updatedAt: _u, ...input } = product;
		expect(productInputSchema.safeParse({ ...input, stock: 12 }).success).toBe(true);
		expect(productInputSchema.safeParse({ ...input, stock: -1 }).success).toBe(false);
		expect(productInputSchema.safeParse({ ...input, stock: 1.5 }).success).toBe(false);
	});
});
