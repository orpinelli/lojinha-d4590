import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toDomainError } from "@/modules/shared/infrastructure/supabase-errors";
import type {
	Category,
	CategoryInput,
	Product,
	ProductInput,
} from "../domain/product";
import type { CatalogRepositories } from "../domain/repositories";

type CategoryRow = {
	id: string;
	name: string;
	position: number;
	created_at: string;
	updated_at: string;
};

type ProductRow = {
	id: string;
	category_id: string;
	name: string;
	description: string;
	price_in_cents: number;
	images: string[];
	sizes: string[];
	details_title: string;
	details_items: string[];
	active: boolean;
	position: number;
	created_at: string;
	updated_at: string;
};

const CATEGORY_COLUMNS = "id, name, position, created_at, updated_at";
const PRODUCT_COLUMNS =
	"id, category_id, name, description, price_in_cents, images, sizes, details_title, details_items, active, position, created_at, updated_at";

const toCategory = (row: CategoryRow): Category => ({
	id: row.id,
	name: row.name,
	position: row.position,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toCategoryRow = (input: CategoryInput) => ({ name: input.name });

const toProduct = (row: ProductRow): Product => ({
	id: row.id,
	categoryId: row.category_id,
	name: row.name,
	description: row.description,
	priceInCents: row.price_in_cents,
	images: row.images,
	sizes: row.sizes,
	details: { title: row.details_title, items: row.details_items },
	active: row.active,
	position: row.position,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toProductRow = (input: ProductInput) => ({
	category_id: input.categoryId,
	name: input.name,
	description: input.description,
	price_in_cents: input.priceInCents,
	images: input.images,
	sizes: input.sizes,
	details_title: input.details.title,
	details_items: input.details.items,
	active: input.active,
});

type Result<T> = { data: T | null; error: { code?: string; message: string } | null };

function unwrap<T>({ data, error }: Result<T>): T | null {
	if (error) throw toDomainError(error);
	return data;
}

/**
 * Supabase (Postgres) adapter. The client decides the privileges: the anon
 * client only sees what RLS exposes publicly; the cookie-bound client of a
 * logged-in admin can write.
 */
export function createSupabaseCatalogRepositories(
	client: SupabaseClient,
): CatalogRepositories {
	const products = () => client.from("products");
	const categories = () => client.from("categories");

	return {
		products: {
			async list(filter) {
				let query = products()
					.select(PRODUCT_COLUMNS)
					.order("position", { ascending: true })
					.order("name", { ascending: true });
				if (filter?.onlyActive) query = query.eq("active", true);
				const rows = unwrap<ProductRow[]>(await query);
				return (rows ?? []).map(toProduct);
			},
			async findById(id) {
				const row = unwrap<ProductRow>(
					await products().select(PRODUCT_COLUMNS).eq("id", id).maybeSingle(),
				);
				return row ? toProduct(row) : null;
			},
			async create(input, position) {
				const row = unwrap<ProductRow>(
					await products()
						.insert({ ...toProductRow(input), position })
						.select(PRODUCT_COLUMNS)
						.single(),
				);
				if (!row) throw new Error("Supabase: produto não retornado após inserir.");
				return toProduct(row);
			},
			async update(id, input) {
				const row = unwrap<ProductRow>(
					await products()
						.update(toProductRow(input))
						.eq("id", id)
						.select(PRODUCT_COLUMNS)
						.maybeSingle(),
				);
				return row ? toProduct(row) : null;
			},
			async delete(id) {
				const rows = unwrap<{ id: string }[]>(
					await products().delete().eq("id", id).select("id"),
				);
				return (rows?.length ?? 0) > 0;
			},
			async countByCategory() {
				const rows = unwrap<{ category_id: string }[]>(
					await products().select("category_id"),
				);
				const counts: Record<string, number> = {};
				for (const { category_id } of rows ?? []) {
					counts[category_id] = (counts[category_id] ?? 0) + 1;
				}
				return counts;
			},
		},

		categories: {
			async list() {
				const rows = unwrap<CategoryRow[]>(
					await categories()
						.select(CATEGORY_COLUMNS)
						.order("position", { ascending: true })
						.order("name", { ascending: true }),
				);
				return (rows ?? []).map(toCategory);
			},
			async findById(id) {
				const row = unwrap<CategoryRow>(
					await categories().select(CATEGORY_COLUMNS).eq("id", id).maybeSingle(),
				);
				return row ? toCategory(row) : null;
			},
			async create(input, position) {
				const row = unwrap<CategoryRow>(
					await categories()
						.insert({ ...toCategoryRow(input), position })
						.select(CATEGORY_COLUMNS)
						.single(),
				);
				if (!row) throw new Error("Supabase: categoria não retornada após inserir.");
				return toCategory(row);
			},
			async update(id, input) {
				const row = unwrap<CategoryRow>(
					await categories()
						.update(toCategoryRow(input))
						.eq("id", id)
						.select(CATEGORY_COLUMNS)
						.maybeSingle(),
				);
				return row ? toCategory(row) : null;
			},
			async delete(id) {
				const rows = unwrap<{ id: string }[]>(
					await categories().delete().eq("id", id).select("id"),
				);
				return (rows?.length ?? 0) > 0;
			},
			async reorder(ids) {
				// Single atomic UPDATE in Postgres (function runs with the caller's RLS).
				unwrap(await client.rpc("reorder_categories", { ids }));
			},
		},
	};
}
