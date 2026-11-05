import type { NextRequest } from "next/server";
import { getStorefrontServices } from "@/lib/server/container";
import { handle, ok, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

/** Public: active products. Admin: `?includeInactive=true` returns all. */
export const GET = handle(async (request: NextRequest) => {
	if (request.nextUrl.searchParams.get("includeInactive") === "true") {
		const { services } = await requireAdmin(request);
		return ok(await services.catalog.listProducts());
	}
	return ok(await getStorefrontServices().catalog.listActiveProducts());
});

export const POST = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);
	const product = await services.catalog.createProduct(await readJson(request));
	revalidateStorefront();
	return ok(product, 201);
});
