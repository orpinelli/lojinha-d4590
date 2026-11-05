import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "@/modules/shared/domain/errors";
import { parseInput } from "@/modules/shared/domain/validation";
import {
	categoryInputSchema,
	productInputSchema,
	type Category,
	type Product,
} from "../domain/catalog-schemas";
import type { CatalogRepositories } from "../domain/repositories";

export type StorefrontSection = { category: Category; products: Product[] };
export type Storefront = {
	sections: StorefrontSection[];
	featured: Product[];
};
export type CategoryWithCount = Category & { productCount: number };
export type PublicProduct = { product: Product; category: Category | null };

/** Catalog use cases. Every write validates untrusted input here. */
export function createCatalogService({
	products,
	categories,
}: CatalogRepositories) {
	async function assertCategoryExists(categoryId: string) {
		if (!(await categories.findById(categoryId))) {
			throw new ValidationError("Confira os campos destacados.", {
				categoryId: ["Categoria não encontrada."],
			});
		}
	}

	return {
		async getStorefront(): Promise<Storefront> {
			const [allCategories, activeProducts] = await Promise.all([
				categories.list(),
				products.list({ onlyActive: true }),
			]);
			const sections = allCategories
				.map((category) => ({
					category,
					products: activeProducts.filter(
						(product) => product.categoryId === category.id,
					),
				}))
				.filter((section) => section.products.length > 0);
			const visibleIds = new Set(
				sections.flatMap((section) => section.products.map((p) => p.id)),
			);
			return {
				sections,
				featured: activeProducts.filter(
					(product) => product.featured && visibleIds.has(product.id),
				),
			};
		},

		async getPublicProduct(id: string): Promise<PublicProduct | null> {
			const product = await products.findById(id);
			if (!product || !product.active) return null;
			return {
				product,
				category: await categories.findById(product.categoryId),
			};
		},

		listProducts(): Promise<Product[]> {
			return products.list();
		},

		async listActiveProducts(): Promise<Product[]> {
			return products.list({ onlyActive: true });
		},

		async getProduct(id: string): Promise<Product> {
			const product = await products.findById(id);
			if (!product) throw new NotFoundError("Produto não encontrado.");
			return product;
		},

		async createProduct(rawInput: unknown): Promise<Product> {
			const input = parseInput(productInputSchema, rawInput);
			await assertCategoryExists(input.categoryId);
			return products.create(input);
		},

		async updateProduct(id: string, rawInput: unknown): Promise<Product> {
			const input = parseInput(productInputSchema, rawInput);
			await assertCategoryExists(input.categoryId);
			const updated = await products.update(id, input);
			if (!updated) throw new NotFoundError("Produto não encontrado.");
			return updated;
		},

		async deleteProduct(id: string): Promise<void> {
			if (!(await products.delete(id))) {
				throw new NotFoundError("Produto não encontrado.");
			}
		},

		async listCategories(): Promise<CategoryWithCount[]> {
			const [list, counts] = await Promise.all([
				categories.list(),
				products.countByCategory(),
			]);
			return list.map((category) => ({
				...category,
				productCount: counts[category.id] ?? 0,
			}));
		},

		createCategory(rawInput: unknown): Promise<Category> {
			return categories.create(parseInput(categoryInputSchema, rawInput));
		},

		async updateCategory(id: string, rawInput: unknown): Promise<Category> {
			const updated = await categories.update(
				id,
				parseInput(categoryInputSchema, rawInput),
			);
			if (!updated) throw new NotFoundError("Categoria não encontrada.");
			return updated;
		},

		async deleteCategory(id: string): Promise<void> {
			const count = (await products.countByCategory())[id] ?? 0;
			if (count > 0) {
				throw new ConflictError(
					`Esta categoria tem ${count} produto(s). Mova-os para outra categoria antes de excluir.`,
				);
			}
			if (!(await categories.delete(id))) {
				throw new NotFoundError("Categoria não encontrada.");
			}
		},
	};
}

export type CatalogService = ReturnType<typeof createCatalogService>;
