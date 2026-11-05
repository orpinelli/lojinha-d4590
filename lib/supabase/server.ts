import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_COOKIE_OPTIONS, type SupabaseConfig } from "./config";

/** Client bound to the visitor's auth cookies (RLS sees the logged-in user). */
export async function createSupabaseSessionClient({ url, key }: SupabaseConfig) {
	const cookieStore = await cookies();
	return createServerClient(url, key, {
		cookieOptions: SUPABASE_COOKIE_OPTIONS,
		cookies: {
			getAll: () => cookieStore.getAll(),
			setAll(cookiesToSet) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// Server Components cannot write cookies; the proxy refreshes them.
				}
			},
		},
	});
}

/** Anonymous client without cookies: cache-friendly public reads. */
export function createSupabasePublicClient({ url, key }: SupabaseConfig) {
	return createClient(url, key, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	});
}
