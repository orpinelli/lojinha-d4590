import type { NextRequest } from "next/server";
import { getRequestServices } from "@/lib/server/container";
import { assertSameOrigin, handle, noContent } from "@/lib/server/http";

export const POST = handle(async (request: NextRequest) => {
	assertSameOrigin(request);
	const { auth } = await getRequestServices();
	await auth.signOut();
	return noContent();
});
