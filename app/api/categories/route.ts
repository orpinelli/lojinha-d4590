import type { NextRequest } from "next/server";
import { getStorefrontServices } from "@/lib/server/container";
import { handle, ok, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

export const GET = handle(async () => {
	return ok(await getStorefrontServices().catalog.listCategories());
});

export const POST = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);
	const category = await services.catalog.createCategory(await readJson(request));
	revalidateStorefront();
	return ok(category, 201);
});
