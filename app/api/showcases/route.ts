import type { NextRequest } from "next/server";
import { getStorefrontServices } from "@/lib/server/container";
import { handle, ok, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

/** Public: the home page showcases with their products. Admin: `?all=true` lists every showcase. */
export const GET = handle(async (request: NextRequest) => {
	if (request.nextUrl.searchParams.get("all") === "true") {
		const { services } = await requireAdmin(request);
		return ok(await services.showcases.listWithCounts());
	}
	return ok(await getStorefrontServices().showcases.getHome());
});

export const POST = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);
	const showcase = await services.showcases.create(await readJson(request));
	revalidateStorefront();
	return ok(showcase, 201);
});
