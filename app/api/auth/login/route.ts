import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@/modules/shared/domain/errors";
import { getRequestServices } from "@/lib/server/container";
import { assertSameOrigin, clientIp, handle, ok, readJson } from "@/lib/server/http";
import { loginLimiter } from "@/lib/server/rate-limit";

export const POST = handle(async (request: NextRequest) => {
	assertSameOrigin(request);
	const limiterKey = `login:${clientIp(request)}`;
	loginLimiter.assertAllowed(limiterKey);

	const credentials = await readJson(request);
	const { auth } = await getRequestServices();
	try {
		const session = await auth.signIn(credentials);
		loginLimiter.reset(limiterKey);
		return ok({ email: session.email });
	} catch (error) {
		if (error instanceof UnauthorizedError) loginLimiter.registerFailure(limiterKey);
		throw error;
	}
});
