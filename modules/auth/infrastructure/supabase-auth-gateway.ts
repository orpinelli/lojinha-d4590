import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
	RateLimitError,
	UnauthorizedError,
	ValidationError,
} from "@/modules/shared/domain/errors";
import { toDomainError } from "@/modules/shared/infrastructure/supabase-errors";
import {
	INVALID_CREDENTIALS_MESSAGE,
	WRONG_CURRENT_PASSWORD_MESSAGE,
	type AdminAuthGateway,
	type AdminSession,
} from "../domain/auth";

/**
 * Supabase Auth (email + password). Being authenticated is not enough: the
 * user must also be listed in `public.admin_users`, the same table the RLS
 * policies use, so the app and the database agree on who is an admin.
 */
export function createSupabaseAuthGateway(client: SupabaseClient): AdminAuthGateway {
	async function isAdmin(userId: string): Promise<boolean> {
		const { data, error } = await client
			.from("admin_users")
			.select("user_id")
			.eq("user_id", userId)
			.maybeSingle();
		if (error) throw toDomainError(error);
		return data !== null;
	}

	return {
		async signIn({ email, password }): Promise<AdminSession> {
			const { data, error } = await client.auth.signInWithPassword({
				email,
				password,
			});
			if (error?.status === 429) throw new RateLimitError();
			if (error || !data.user) {
				throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
			}
			if (!(await isAdmin(data.user.id))) {
				await client.auth.signOut();
				throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
			}
			return { userId: data.user.id, email: data.user.email ?? email };
		},

		async signOut() {
			await client.auth.signOut();
		},

		async currentSession() {
			// getUser() validates the token with the Auth server (never trust
			// the cookie contents alone).
			const { data, error } = await client.auth.getUser();
			if (error || !data.user) return null;
			if (!(await isAdmin(data.user.id))) return null;
			return { userId: data.user.id, email: data.user.email ?? "" };
		},

		async changePassword({ currentPassword, newPassword }) {
			const { data } = await client.auth.getUser();
			if (!data.user?.email || !(await isAdmin(data.user.id))) throw new UnauthorizedError();
			// Proves the person at the keyboard knows the password (not just the cookie).
			const check = await client.auth.signInWithPassword({
				email: data.user.email,
				password: currentPassword,
			});
			if (check.error?.status === 429) throw new RateLimitError();
			if (check.error) {
				throw new ValidationError(WRONG_CURRENT_PASSWORD_MESSAGE, {
					currentPassword: [WRONG_CURRENT_PASSWORD_MESSAGE],
				});
			}
			const { error } = await client.auth.updateUser({ password: newPassword });
			if (error) {
				const message =
					error.status === 422 ? "Senha fraca ou já usada. Escolha outra." : error.message;
				throw new ValidationError(message, { newPassword: [message] });
			}
		},
	};
}
