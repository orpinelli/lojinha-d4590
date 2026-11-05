import "server-only";
import { RateLimitError } from "@/modules/shared/domain/errors";

type Entry = { failures: number; resetAt: number };

/**
 * In-memory failure counter (per server instance). Supabase Auth also applies
 * its own limits; this blocks brute force before reaching it.
 */
export function createFailureLimiter({
	maxFailures,
	windowMs,
}: {
	maxFailures: number;
	windowMs: number;
}) {
	const entries = new Map<string, Entry>();

	function prune(now: number) {
		for (const [key, entry] of entries) {
			if (entry.resetAt <= now) entries.delete(key);
		}
	}

	return {
		assertAllowed(key: string) {
			const entry = entries.get(key);
			const now = Date.now();
			if (entry && entry.resetAt > now && entry.failures >= maxFailures) {
				const minutes = Math.ceil((entry.resetAt - now) / 60_000);
				throw new RateLimitError(
					`Muitas tentativas. Tente novamente em ${minutes} minuto(s).`,
				);
			}
		},
		registerFailure(key: string) {
			const now = Date.now();
			if (entries.size > 10_000) prune(now);
			const entry = entries.get(key);
			if (!entry || entry.resetAt <= now) {
				entries.set(key, { failures: 1, resetAt: now + windowMs });
			} else {
				entry.failures += 1;
			}
		},
		reset(key: string) {
			entries.delete(key);
		},
	};
}

const perClient = createFailureLimiter({ maxFailures: 5, windowMs: 15 * 60_000 });
// Second layer that does not depend on the IP (spoofed/rotating addresses).
const global = createFailureLimiter({ maxFailures: 50, windowMs: 15 * 60_000 });
const GLOBAL_KEY = "*";

export const loginLimiter = {
	assertAllowed(clientKey: string) {
		global.assertAllowed(GLOBAL_KEY);
		perClient.assertAllowed(clientKey);
	},
	registerFailure(clientKey: string) {
		global.registerFailure(GLOBAL_KEY);
		perClient.registerFailure(clientKey);
	},
	reset(clientKey: string) {
		perClient.reset(clientKey);
	},
};
