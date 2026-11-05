import { SignJWT, jwtVerify } from "jose";
import { ConfigurationError } from "@/modules/shared/domain/errors";
import type { AdminSession } from "../domain/auth";

/** Used only in local mode; Supabase manages its own session cookies. */
export const LOCAL_SESSION_COOKIE = "lojinha_admin_session";
export const LOCAL_SESSION_TTL_SECONDS = 60 * 60 * 12;

const AUDIENCE = "lojinha-admin";

function secretKey(): Uint8Array {
	const secret = process.env.AUTH_SECRET;
	if (!secret || secret.length < 32) {
		throw new ConfigurationError(
			"Defina AUTH_SECRET com pelo menos 32 caracteres no .env.local.",
		);
	}
	return new TextEncoder().encode(secret);
}

export function signLocalSessionToken(
	session: AdminSession,
	expiresAt: Date,
): Promise<string> {
	return new SignJWT({ email: session.email })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(session.userId)
		.setAudience(AUDIENCE)
		.setIssuedAt()
		.setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
		.sign(secretKey());
}

export async function verifyLocalSessionToken(
	token: string,
): Promise<AdminSession | null> {
	const key = secretKey();
	try {
		const { payload } = await jwtVerify(token, key, {
			algorithms: ["HS256"],
			audience: AUDIENCE,
		});
		if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
			return null;
		}
		return { userId: payload.sub, email: payload.email };
	} catch {
		return null;
	}
}
