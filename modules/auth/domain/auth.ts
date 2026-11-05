export type AdminSession = { userId: string; email: string };

export type Credentials = { email: string; password: string };

/**
 * Port for admin authentication. Adapters: environment credentials with a
 * signed cookie (local mode) and Supabase Auth + `admin_users` (production).
 */
export interface AdminAuthGateway {
	/** Throws `UnauthorizedError` for wrong credentials or non-admin users. */
	signIn(credentials: Credentials): Promise<AdminSession>;
	signOut(): Promise<void>;
	/** Returns the session only when it is valid AND belongs to an admin. */
	currentSession(): Promise<AdminSession | null>;
	/** Re-checks the current password before setting the new one. */
	changePassword(change: PasswordChange): Promise<void>;
}

export type PasswordChange = { currentPassword: string; newPassword: string };

export const WRONG_CURRENT_PASSWORD_MESSAGE = "Senha atual incorreta.";

export const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos.";
