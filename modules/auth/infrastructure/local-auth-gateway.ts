import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { ConfigurationError, UnauthorizedError } from "@/modules/shared/domain/errors";
import { INVALID_CREDENTIALS_MESSAGE, type AdminAuthGateway } from "../domain/auth";
import {
	LOCAL_SESSION_COOKIE,
	LOCAL_SESSION_TTL_SECONDS,
	signLocalSessionToken,
	verifyLocalSessionToken,
} from "./local-session-token";

/** Minimal cookie port so this adapter does not depend on Next.js. */
export interface CookieJar {
	get(name: string): string | undefined;
	set(name: string, value: string, expires: Date): void;
	delete(name: string): void;
}

/** Constant-time comparison that also hides length differences. */
function safeEqual(a: string, b: string): boolean {
	const digest = (value: string) => createHash("sha256").update(value).digest();
	return timingSafeEqual(digest(a), digest(b));
}

/** Local mode: a single admin defined by ADMIN_EMAIL / ADMIN_PASSWORD. */
export function createLocalAuthGateway(cookies: CookieJar): AdminAuthGateway {
	return {
		async signIn({ email, password }) {
			const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
			const expectedPassword = process.env.ADMIN_PASSWORD;
			if (!expectedEmail || !expectedPassword) {
				throw new ConfigurationError(
					"Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env.local para usar o modo local.",
				);
			}
			const emailMatches = safeEqual(email, expectedEmail);
			const passwordMatches = safeEqual(password, expectedPassword);
			if (!emailMatches || !passwordMatches) {
				throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
			}
			const session = { userId: "local-admin", email: expectedEmail };
			const expiresAt = new Date(Date.now() + LOCAL_SESSION_TTL_SECONDS * 1000);
			cookies.set(
				LOCAL_SESSION_COOKIE,
				await signLocalSessionToken(session, expiresAt),
				expiresAt,
			);
			return session;
		},

		async signOut() {
			cookies.delete(LOCAL_SESSION_COOKIE);
		},

		async currentSession() {
			const token = cookies.get(LOCAL_SESSION_COOKIE);
			return token ? verifyLocalSessionToken(token) : null;
		},

		async changePassword() {
			throw new ConfigurationError(
				"No modo local a senha é a variável ADMIN_PASSWORD do .env.local.",
			);
		},
	};
}
