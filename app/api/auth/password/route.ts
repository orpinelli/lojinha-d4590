import type { NextRequest } from "next/server";
import { ValidationError } from "@/modules/shared/domain/errors";
import { clientIp, handle, noContent, readJson, requireAdmin } from "@/lib/server/http";
import { loginLimiter } from "@/lib/server/rate-limit";

/** Body: `{ currentPassword, newPassword, confirmPassword }` (logged-in admin). */
export const POST = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);
	const limiterKey = `login:${clientIp(request)}`;
	loginLimiter.assertAllowed(limiterKey);
	try {
		await services.auth.changePassword(await readJson(request));
		return noContent();
	} catch (error) {
		// Wrong current password counts as a failed login attempt.
		if (error instanceof ValidationError && error.fieldErrors.currentPassword) {
			loginLimiter.registerFailure(limiterKey);
		}
		throw error;
	}
});
