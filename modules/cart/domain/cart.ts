export type CartItem = {
	productId: string;
	name: string;
	priceInCents: number;
	image: string;
	quantity: number;
	size?: string;
};

export type NewCartItem = Omit<CartItem, "quantity">;

const isSameLine = (item: CartItem, productId: string, size?: string) =>
	item.productId === productId && (item.size ?? "") === (size ?? "");

export function addCartItem(
	items: CartItem[],
	item: NewCartItem,
	quantity = 1,
): CartItem[] {
	const existing = items.find((line) =>
		isSameLine(line, item.productId, item.size),
	);
	if (!existing) return [...items, { ...item, quantity }];
	return items.map((line) =>
		line === existing ? { ...line, quantity: line.quantity + quantity } : line,
	);
}

export function removeCartItem(
	items: CartItem[],
	productId: string,
	size?: string,
): CartItem[] {
	return items.filter((line) => !isSameLine(line, productId, size));
}

export function setCartItemQuantity(
	items: CartItem[],
	productId: string,
	quantity: number,
	size?: string,
): CartItem[] {
	if (quantity <= 0) return removeCartItem(items, productId, size);
	return items.map((line) =>
		isSameLine(line, productId, size) ? { ...line, quantity } : line,
	);
}

export function cartTotal(items: CartItem[]): number {
	return items.reduce((total, line) => total + line.priceInCents * line.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
	return items.reduce((total, line) => total + line.quantity, 0);
}

export type CatalogSnapshot = {
	id: string;
	name: string;
	priceInCents: number;
	images: string[];
};

/**
 * Re-applies current catalog data to a saved cart: prices/names changed in the
 * admin are reflected and products no longer for sale are removed.
 */
export function reconcileCart(items: CartItem[], products: CatalogSnapshot[]): CartItem[] {
	const byId = new Map(products.map((product) => [product.id, product]));
	return items.flatMap((item) => {
		const product = byId.get(item.productId);
		if (!product) return [];
		return [
			{
				...item,
				name: product.name,
				priceInCents: product.priceInCents,
				image: product.images[0] ?? item.image,
			},
		];
	});
}

/**
 * Restores a cart saved in localStorage. Accepts the legacy shape
 * (`id: number`, `price` in reais) so existing visitors keep their cart.
 */
export function parseStoredCart(raw: unknown): CartItem[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((entry): CartItem[] => {
		if (typeof entry !== "object" || entry === null) return [];
		const value = entry as Record<string, unknown>;
		const productId = value.productId ?? value.id;
		const priceInCents =
			typeof value.priceInCents === "number"
				? value.priceInCents
				: typeof value.price === "number"
					? Math.round(value.price * 100)
					: Number.NaN;
		const quantity = Number(value.quantity);
		if (
			(typeof productId !== "string" && typeof productId !== "number") ||
			typeof value.name !== "string" ||
			!Number.isFinite(priceInCents) ||
			!Number.isInteger(quantity) ||
			quantity <= 0
		) {
			return [];
		}
		return [
			{
				productId: String(productId),
				name: value.name,
				priceInCents,
				image: typeof value.image === "string" ? value.image : "",
				quantity,
				size: typeof value.size === "string" && value.size ? value.size : undefined,
			},
		];
	});
}
