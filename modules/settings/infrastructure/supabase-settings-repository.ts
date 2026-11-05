import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toDomainError } from "@/modules/shared/infrastructure/supabase-errors";
import type { SettingsRepository } from "../domain/site-settings";
import { normalizeSiteSettings } from "../domain/site-settings-schemas";
import { defaultSiteSettings } from "./settings-seed";

type SettingsRow = { section: string; data: unknown };

/** One row per section in `public.site_settings` (jsonb), validated on read. */
export function createSupabaseSettingsRepository(
	client: SupabaseClient,
): SettingsRepository {
	async function get() {
		const { data, error } = await client
			.from("site_settings")
			.select("section, data");
		if (error) throw toDomainError(error);
		const stored = Object.fromEntries(
			((data ?? []) as SettingsRow[]).map((row) => [row.section, row.data]),
		);
		return normalizeSiteSettings(stored, defaultSiteSettings());
	}

	return {
		get,
		async saveSections(patch) {
			const rows = Object.entries(patch).map(([section, data]) => ({
				section,
				data,
			}));
			const { error } = await client
				.from("site_settings")
				.upsert(rows, { onConflict: "section" });
			if (error) throw toDomainError(error);
			return get();
		},
	};
}
