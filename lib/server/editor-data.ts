import "server-only";
import { productCover } from "@/modules/catalog/domain/product";
import type { ShowcaseCandidate } from "@/modules/showcase/domain/showcase";
import type { RequestServices } from "./container";

/** Minimal catalog snapshot for the showcase editor (keeps the payload small). */
export async function loadShowcaseEditorData({ catalog }: Pick<RequestServices, "catalog">) {
	const [products, categories] = await Promise.all([
		catalog.listProducts(),
		catalog.listCategories(),
	]);
	return {
		products: products.map(
			(product): ShowcaseCandidate => ({
				id: product.id,
				name: product.name,
				categoryId: product.categoryId,
				image: productCover(product),
				active: product.active,
			}),
		),
		categories: categories.map(({ id, name }) => ({ id, name })),
	};
}
