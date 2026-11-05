import type { NextRequest } from "next/server";
import { handle, noContent, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

/** Body: `{ "ids": [...] }` — every showcase id, in the new page order. */
export const PUT = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);
	await services.showcases.reorder(await readJson(request));
	revalidateStorefront();
	return noContent();
});
