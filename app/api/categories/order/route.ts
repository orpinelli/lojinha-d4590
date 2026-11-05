import type { NextRequest } from "next/server";
import { handle, noContent, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

/** Body: `{ "ids": [...] }` — every category id, in the new order. */
export const PUT = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);
	await services.catalog.reorderCategories(await readJson(request));
	revalidateStorefront();
	return noContent();
});
