import { parseInput } from "@/modules/shared/domain/validation";
import type { AdminAuthGateway, AdminSession } from "../domain/auth";
import { credentialsSchema, passwordChangeSchema } from "../domain/auth-schemas";

export function createAuthService(gateway: AdminAuthGateway) {
	return {
		signIn(rawCredentials: unknown): Promise<AdminSession> {
			return gateway.signIn(parseInput(credentialsSchema, rawCredentials));
		},

		signOut(): Promise<void> {
			return gateway.signOut();
		},

		currentSession(): Promise<AdminSession | null> {
			return gateway.currentSession();
		},

		changePassword(rawInput: unknown): Promise<void> {
			const { currentPassword, newPassword } = parseInput(passwordChangeSchema, rawInput);
			return gateway.changePassword({ currentPassword, newPassword });
		},
	};
}

export type AuthService = ReturnType<typeof createAuthService>;
