import type { Product } from "@/modules/catalog/domain/product";
import type { CatalogRepositories } from "@/modules/catalog/domain/repositories";
import { NotFoundError, ValidationError } from "@/modules/shared/domain/errors";
import { assertSameItems, nextPosition, reorderSchema } from "@/modules/shared/domain/ordering";
import { parseInput } from "@/modules/shared/domain/validation";
import {
	resolveShowcaseProducts,
	type Showcase,
	type ShowcaseInput,
	type ShowcaseRepository,
} from "../domain/showcase";
import { showcaseInputSchema } from "../domain/showcase-schemas";

export type HomeShowcase = { showcase: Showcase; products: Product[] };
export type ShowcaseSummary = Showcase & { productCount: number };

type Dependencies = CatalogRepositories & { showcases: ShowcaseRepository };

/** Showcase ("vitrine") use cases: the home page is built only from these. */
export function createShowcaseService({ showcases, products, categories }: Dependencies) {
	/** Drops references to deleted products/categories before saving. */
	async function sanitize(input: ShowcaseInput): Promise<ShowcaseInput> {
		const [allProducts, allCategories] = await Promise.all([products.list(), categories.list()]);
		const productIds = new Set(allProducts.map((product) => product.id));
		const categoryIds = new Set(allCategories.map((category) => category.id));
		const clean: ShowcaseInput = {
			...input,
			categoryIds: input.categoryIds.filter((id) => categoryIds.has(id)),
			productIds: input.productIds.filter((id) => productIds.has(id)),
			excludedProductIds: input.excludedProductIds.filter((id) => productIds.has(id)),
		};
		if (clean.source === "categories" && clean.categoryIds.length === 0) {
			throw new ValidationError("Confira os campos destacados.", {
				categoryIds: ["Escolha pelo menos uma categoria existente."],
			});
		}
		if (clean.source === "products" && clean.productIds.length === 0) {
			throw new ValidationError("Confira os campos destacados.", {
				productIds: ["Escolha pelo menos um produto existente."],
			});
		}
		return clean;
	}

	return {
		/** Visible showcases with their products, in page order (empty ones are skipped). */
		async getHome(): Promise<HomeShowcase[]> {
			const [list, activeProducts] = await Promise.all([
				showcases.list(),
				products.list({ onlyActive: true }),
			]);
			return list
				.filter((showcase) => showcase.active)
				.map((showcase) => ({
					showcase,
					products: resolveShowcaseProducts(showcase, activeProducts),
				}))
				.filter(({ products: items }) => items.length > 0);
		},

		async listWithCounts(): Promise<ShowcaseSummary[]> {
			const [list, activeProducts] = await Promise.all([
				showcases.list(),
				products.list({ onlyActive: true }),
			]);
			return list.map((showcase) => ({
				...showcase,
				productCount: resolveShowcaseProducts(showcase, activeProducts).length,
			}));
		},

		async get(id: string): Promise<Showcase> {
			const showcase = await showcases.findById(id);
			if (!showcase) throw new NotFoundError("Vitrine não encontrada.");
			return showcase;
		},

		/** Titles of the visible showcases where a product appears. */
		async titlesForProduct(productId: string): Promise<string[]> {
			const [list, allProducts] = await Promise.all([showcases.list(), products.list()]);
			return list
				.filter(
					(showcase) =>
						showcase.active &&
						resolveShowcaseProducts(showcase, allProducts).some((product) => product.id === productId),
				)
				.map((showcase) => showcase.title);
		},

		async create(rawInput: unknown): Promise<Showcase> {
			const input = await sanitize(parseInput(showcaseInputSchema, rawInput));
			return showcases.create(input, nextPosition(await showcases.list()));
		},

		async update(id: string, rawInput: unknown): Promise<Showcase> {
			const input = await sanitize(parseInput(showcaseInputSchema, rawInput));
			const updated = await showcases.update(id, input);
			if (!updated) throw new NotFoundError("Vitrine não encontrada.");
			return updated;
		},

		async delete(id: string): Promise<void> {
			if (!(await showcases.delete(id))) throw new NotFoundError("Vitrine não encontrada.");
		},

		async reorder(rawInput: unknown): Promise<void> {
			const { ids } = parseInput(reorderSchema, rawInput);
			assertSameItems(ids, (await showcases.list()).map((showcase) => showcase.id));
			await showcases.reorder(ids);
		},
	};
}

export type ShowcaseService = ReturnType<typeof createShowcaseService>;
