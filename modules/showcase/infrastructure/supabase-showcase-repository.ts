import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toDomainError } from "@/modules/shared/infrastructure/supabase-errors";
import type { Showcase, ShowcaseInput, ShowcaseRepository } from "../domain/showcase";

type ShowcaseRow = {
	id: string;
	title: string;
	layout: Showcase["layout"];
	source: Showcase["source"];
	category_ids: string[];
	product_ids: string[];
	excluded_product_ids: string[];
	active: boolean;
	position: number;
	created_at: string;
	updated_at: string;
};

const COLUMNS =
	"id, title, layout, source, category_ids, product_ids, excluded_product_ids, active, position, created_at, updated_at";

const toShowcase = (row: ShowcaseRow): Showcase => ({
	id: row.id,
	title: row.title,
	layout: row.layout,
	source: row.source,
	categoryIds: row.category_ids,
	productIds: row.product_ids,
	excludedProductIds: row.excluded_product_ids,
	active: row.active,
	position: row.position,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toRow = (input: ShowcaseInput) => ({
	title: input.title,
	layout: input.layout,
	source: input.source,
	category_ids: input.categoryIds,
	product_ids: input.productIds,
	excluded_product_ids: input.excludedProductIds,
	active: input.active,
});

type Result<T> = { data: T | null; error: { code?: string; message: string } | null };

function unwrap<T>({ data, error }: Result<T>): T | null {
	if (error) throw toDomainError(error);
	return data;
}

/** `public.showcases`: visitors read active rows; admins write (RLS). */
export function createSupabaseShowcaseRepository(client: SupabaseClient): ShowcaseRepository {
	const table = () => client.from("showcases");

	return {
		async list() {
			const rows = unwrap<ShowcaseRow[]>(
				await table().select(COLUMNS).order("position", { ascending: true }),
			);
			return (rows ?? []).map(toShowcase);
		},
		async findById(id) {
			const row = unwrap<ShowcaseRow>(await table().select(COLUMNS).eq("id", id).maybeSingle());
			return row ? toShowcase(row) : null;
		},
		async create(input, position) {
			const row = unwrap<ShowcaseRow>(
				await table().insert({ ...toRow(input), position }).select(COLUMNS).single(),
			);
			if (!row) throw new Error("Supabase: vitrine não retornada após inserir.");
			return toShowcase(row);
		},
		async update(id, input) {
			const row = unwrap<ShowcaseRow>(
				await table().update(toRow(input)).eq("id", id).select(COLUMNS).maybeSingle(),
			);
			return row ? toShowcase(row) : null;
		},
		async delete(id) {
			const rows = unwrap<{ id: string }[]>(await table().delete().eq("id", id).select("id"));
			return (rows?.length ?? 0) > 0;
		},
		async reorder(ids) {
			unwrap(await client.rpc("reorder_showcases", { ids }));
		},
	};
}
