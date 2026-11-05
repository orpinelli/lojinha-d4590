import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
	LOCAL_SESSION_COOKIE,
	verifyLocalSessionToken,
} from "@/modules/auth/infrastructure/local-session-token";
import { readSupabaseConfig, resolveDataProvider } from "@/lib/supabase/config";

const LOGIN_PATH = "/gerenciamento/login";

/**
 * Optimistic gate for the admin area + Supabase session refresh. The real
 * authorization happens again in every admin page, API route and in the
 * database (RLS) — this is only the first layer.
 */
export async function proxy(request: NextRequest) {
	let response = NextResponse.next({ request });
	let authenticated = false;

	try {
		if (resolveDataProvider() === "supabase") {
			const config = readSupabaseConfig();
			if (config) {
				const supabase = createServerClient(config.url, config.key, {
					cookies: {
						getAll: () => request.cookies.getAll(),
						setAll(cookiesToSet, headers) {
							for (const { name, value } of cookiesToSet) {
								request.cookies.set(name, value);
							}
							response = NextResponse.next({ request });
							for (const { name, value, options } of cookiesToSet) {
								response.cookies.set(name, value, options);
							}
							for (const [key, value] of Object.entries(headers)) {
								response.headers.set(key, value);
							}
						},
					},
				});
				const { data } = await supabase.auth.getUser();
				authenticated = Boolean(data.user);
			}
		} else {
			const token = request.cookies.get(LOCAL_SESSION_COOKIE)?.value;
			authenticated = token ? (await verifyLocalSessionToken(token)) !== null : false;
		}
	} catch {
		authenticated = false;
	}

	const { pathname, search } = request.nextUrl;
	if (!authenticated && pathname !== LOGIN_PATH) {
		const loginUrl = new URL(LOGIN_PATH, request.url);
		loginUrl.searchParams.set("next", `${pathname}${search}`);
		const redirect = NextResponse.redirect(loginUrl);
		for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
		return redirect;
	}

	return response;
}

export const config = {
	matcher: ["/gerenciamento/:path*"],
};
