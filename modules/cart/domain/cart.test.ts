/// <reference types="vitest/globals" />
import {
	addCartItem,
	cartCount,
	cartTotal,
	parseStoredCart,
	reconcileCart,
	removeCartItem,
	setCartItemQuantity,
	type CartItem,
} from "./cart";

const shirt = { productId: "1", name: "Camiseta", priceInCents: 6000, image: "/a.png" };
const mug = { productId: "2", name: "Caneca", priceInCents: 2500, image: "/b.png" };

describe("cart", () => {
	it("merges the same product and size into one line", () => {
		let items = addCartItem([], { ...shirt, size: "M" });
		items = addCartItem(items, { ...shirt, size: "M" }, 2);
		expect(items).toEqual([{ ...shirt, size: "M", quantity: 3 }]);
	});

	it("keeps different sizes of the same product apart", () => {
		let items = addCartItem([], { ...shirt, size: "M" });
		items = addCartItem(items, { ...shirt, size: "G" });
		expect(items.map((item) => item.size)).toEqual(["M", "G"]);
	});

	it("changes quantity and removes the line at zero", () => {
		const items = addCartItem(addCartItem([], { ...shirt, size: "M" }), mug);
		expect(setCartItemQuantity(items, "2", 4)[1].quantity).toBe(4);
		expect(setCartItemQuantity(items, "1", 0, "M")).toHaveLength(1);
		expect(removeCartItem(items, "2")).toHaveLength(1);
	});

	it("sums total in cents and item count", () => {
		const items: CartItem[] = [
			{ ...shirt, size: "M", quantity: 2 },
			{ ...mug, quantity: 1 },
		];
		expect(cartTotal(items)).toBe(14500);
		expect(cartCount(items)).toBe(3);
	});

	it("applies current catalog prices and drops products no longer for sale", () => {
		const items: CartItem[] = [
			{ ...shirt, quantity: 1 },
			{ ...mug, quantity: 1 },
		];
		const result = reconcileCart(items, [
			{ id: "1", name: "Camiseta nova", priceInCents: 7000, images: ["/c.png"] },
		]);
		expect(result).toEqual([
			{ ...shirt, name: "Camiseta nova", priceInCents: 7000, image: "/c.png", quantity: 1 },
		]);
	});

	it("restores the legacy saved shape and ignores junk", () => {
		const restored = parseStoredCart([
			{ id: 12, name: "Pin", price: 15, quantity: 2, image: "/p.png" },
			{ productId: "x", name: "Sem quantidade" },
			"lixo",
		]);
		expect(restored).toEqual([
			{ productId: "12", name: "Pin", priceInCents: 1500, image: "/p.png", quantity: 2, size: undefined },
		]);
		expect(parseStoredCart({ not: "an array" })).toEqual([]);
	});
});
