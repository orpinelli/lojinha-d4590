export type SupabaseConfig = { url: string; key: string };
export type DataProviderName = "local" | "supabase";

/** Server-only env. The publishable (anon) key is safe for RLS-protected use. */
export function readSupabaseConfig(): SupabaseConfig | null {
	const url = process.env.SUPABASE_URL?.trim();
	const key = (
		process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY
	)?.trim();
	return url && key ? { url, key } : null;
}

/**
 * `DATA_PROVIDER` wins when set; otherwise Supabase is used as soon as it is
 * configured, falling back to local files. Shared by the container and proxy.
 */
export function resolveDataProvider(): DataProviderName {
	const requested = process.env.DATA_PROVIDER?.trim();
	if (requested === "local" || requested === "supabase") return requested;
	if (requested) {
		throw new Error(`DATA_PROVIDER inválido: "${requested}". Use "local" ou "supabase".`);
	}
	return readSupabaseConfig() ? "supabase" : "local";
}
