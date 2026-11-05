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

export const DEFAULT_SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;

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
