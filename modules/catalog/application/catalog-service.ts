import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "@/modules/shared/domain/errors";
import { assertSameItems, nextPosition, reorderSchema } from "@/modules/shared/domain/ordering";
import { parseInput } from "@/modules/shared/domain/validation";
import {
	categoryInputSchema,
	productInputSchema,
	type Category,
	type Product,
} from "../domain/catalog-schemas";
import type { CatalogRepositories } from "../domain/repositories";

export type CategoryWithCount = Category & { productCount: number };
export type PublicProduct = { product: Product; category: Category | null };

/** Catalog use cases. Every write validates untrusted input here. */
export function createCatalogService({ products, categories }: CatalogRepositories) {
	async function assertCategoryExists(categoryId: string) {
		if (!(await categories.findById(categoryId))) {
			throw new ValidationError("Confira os campos destacados.", {
				categoryId: ["Categoria não encontrada."],
			});
		}
	}

	return {
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

		listActiveProducts(): Promise<Product[]> {
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
			return products.create(input, nextPosition(await products.list()));
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

		async createCategory(rawInput: unknown): Promise<Category> {
			const input = parseInput(categoryInputSchema, rawInput);
			return categories.create(input, nextPosition(await categories.list()));
		},

		async updateCategory(id: string, rawInput: unknown): Promise<Category> {
			const updated = await categories.update(id, parseInput(categoryInputSchema, rawInput));
			if (!updated) throw new NotFoundError("Categoria não encontrada.");
			return updated;
		},

		async reorderCategories(rawInput: unknown): Promise<void> {
			const { ids } = parseInput(reorderSchema, rawInput);
			assertSameItems(ids, (await categories.list()).map((category) => category.id));
			await categories.reorder(ids);
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
