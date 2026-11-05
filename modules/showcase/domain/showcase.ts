/** Zod-free showcase rules: shared by the storefront and the admin editor. */
export type {
	Showcase,
	ShowcaseInput,
	ShowcaseLayout,
	ShowcaseSource,
} from "./showcase-schemas";

import type { Showcase, ShowcaseInput, ShowcaseLayout } from "./showcase-schemas";

export const SHOWCASE_LAYOUT_LABELS: Record<ShowcaseLayout, string> = {
	carousel: "Carrossel",
	grid: "Grade",
	featured: "Destaque",
};

type Rules = Pick<ShowcaseInput, "source" | "categoryIds" | "productIds" | "excludedProductIds">;
type Candidate = { id: string; categoryId: string };

/** Lightweight product data used by the showcase editor. */
export type ShowcaseCandidate = Candidate & { name: string; image: string; active: boolean };

/**
 * Category showcases: products of the chosen categories ordered by the manual
 * order (`productIds`) first, then category order, then the default order of
 * the given list (unknown ids are simply ignored).
 */
function orderCategoryProducts<P extends Candidate>(rules: Rules, products: P[]): P[] {
	const categoryRank = new Map(rules.categoryIds.map((id, index) => [id, index]));
	const manualRank = new Map(rules.productIds.map((id, index) => [id, index]));
	return products
		.map((product, index) => ({ product, index }))
		.filter(({ product }) => categoryRank.has(product.categoryId))
		.sort(
			(a, b) =>
				(manualRank.get(a.product.id) ?? Number.MAX_SAFE_INTEGER) -
					(manualRank.get(b.product.id) ?? Number.MAX_SAFE_INTEGER) ||
				(categoryRank.get(a.product.categoryId) ?? 0) -
					(categoryRank.get(b.product.categoryId) ?? 0) ||
				a.index - b.index,
		)
		.map(({ product }) => product);
}

/** Products shown by a showcase, in display order. */
export function resolveShowcaseProducts<P extends Candidate>(rules: Rules, products: P[]): P[] {
	if (rules.source === "products") {
		const byId = new Map(products.map((product) => [product.id, product]));
		return rules.productIds.flatMap((id) => {
			const product = byId.get(id);
			return product ? [product] : [];
		});
	}
	const excluded = new Set(rules.excludedProductIds);
	return orderCategoryProducts(rules, products).filter((product) => !excluded.has(product.id));
}

/** Admin editor rows: every candidate (hidden ones included), in display order. */
export function showcaseEditorRows<P extends Candidate>(
	rules: Rules,
	products: P[],
): { product: P; hidden: boolean }[] {
	if (rules.source === "products") {
		return resolveShowcaseProducts(rules, products).map((product) => ({ product, hidden: false }));
	}
	const excluded = new Set(rules.excludedProductIds);
	return orderCategoryProducts(rules, products).map((product) => ({
		product,
		hidden: excluded.has(product.id),
	}));
}

/** Port implemented by each storage adapter. */
export interface ShowcaseRepository {
	/** Sorted by `position`. */
	list(): Promise<Showcase[]>;
	findById(id: string): Promise<Showcase | null>;
	create(input: ShowcaseInput, position: number): Promise<Showcase>;
	/** Keeps the current position. */
	update(id: string, input: ShowcaseInput): Promise<Showcase | null>;
	delete(id: string): Promise<boolean>;
	reorder(ids: string[]): Promise<void>;
}
