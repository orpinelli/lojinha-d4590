/**
 * Zod-free entry point for the catalog domain, safe to import from storefront
 * client components (keeps the validation library out of the shop bundle).
 */
export type {
	Category,
	CategoryInput,
	Product,
	ProductDetails,
	ProductInput,
} from "./catalog-schemas";

import type { Product } from "./catalog-schemas";

/**
 * What the store (visitors) receives: no stock information. Admin-only fields
 * never reach the browser of a visitor.
 */
export type StoreProduct = Omit<Product, "stock" | "trackStock">;

export function toStoreProduct({ stock: _stock, trackStock: _trackStock, ...product }: Product): StoreProduct {
	return product;
}

export type Availability = "available" | "inactive" | "out-of-stock";

/**
 * Whether the store shows the product: it must be active and, when its stock is
 * controlled, have stock. Restocking brings it back by itself.
 */
export function productAvailability(product: Pick<Product, "active" | "stock" | "trackStock">): Availability {
	if (!product.active) return "inactive";
	if (product.trackStock && product.stock <= 0) return "out-of-stock";
	return "available";
}

export function isAvailable(product: Pick<Product, "active" | "stock" | "trackStock">): boolean {
	return productAvailability(product) === "available";
}

export const DEFAULT_SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;

/** Room for longer sizes such as "BABY LOOK G". */
export const MAX_SIZE_LENGTH = 20;

export function productCover(product: Pick<Product, "images">): string {
	return product.images[0] ?? "";
}

export function requiresSize(product: Pick<Product, "sizes">): boolean {
	return product.sizes.length > 0;
}

export function productPath(product: Pick<Product, "id">): string {
	return `/product/${encodeURIComponent(product.id)}`;
}

/** Default order used across the app: position, then name. */
export function byPositionThenName(
	a: { position: number; name: string },
	b: { position: number; name: string },
): number {
	return a.position - b.position || a.name.localeCompare(b.name, "pt-BR");
}
