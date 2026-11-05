import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { ConfigurationError } from "@/modules/shared/domain/errors";
import type { AdminSession } from "@/modules/auth/domain/auth";
import { getRequestServices } from "./container";

export const ADMIN_LOGIN_PATH = "/gerenciamento/login";
export const ADMIN_HOME_PATH = "/gerenciamento";

/** Verified admin session for the current request (memoized per render). */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
	try {
		return await (await getRequestServices()).auth.currentSession();
	} catch (error) {
		// Let Next.js control-flow errors (dynamic rendering, redirects) through.
		unstable_rethrow(error);
		if (error instanceof ConfigurationError) throw error;
		console.error("[auth] could not verify session", error);
		return null;
	}
});

/**
 * Data-access guard for admin pages. The proxy only does an optimistic
 * redirect; every admin page calls this before reading data.
 */
export async function requireAdminSession(): Promise<AdminSession> {
	const session = await getAdminSession();
	if (!session) redirect(ADMIN_LOGIN_PATH);
	return session;
}

/** Only allow redirects back into the admin area (prevents open redirects). */
export function safeAdminRedirect(target: string | null | undefined): string {
	if (
		target &&
		target.startsWith(ADMIN_HOME_PATH) &&
		!target.startsWith("//") &&
		!target.startsWith(ADMIN_LOGIN_PATH)
	) {
		return target;
	}
	return ADMIN_HOME_PATH;
}
