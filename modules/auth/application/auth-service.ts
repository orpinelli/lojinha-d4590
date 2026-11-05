import { parseInput } from "@/modules/shared/domain/validation";
import type { AdminAuthGateway, AdminSession } from "../domain/auth";
import { credentialsSchema } from "../domain/auth-schemas";

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
	};
}

export type AuthService = ReturnType<typeof createAuthService>;
