import type { NextRequest } from "next/server";
import { getStorefrontServices } from "@/lib/server/container";
import { handle, ok, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

export const GET = handle(async () => {
	return ok(await getStorefrontServices().settings.get());
});

/** Body: `{ [section]: completeSectionData }` — e.g. `{ hero: {...} }`. */
export const PATCH = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);
	const settings = await services.settings.update(await readJson(request));
	revalidateStorefront();
	return ok(settings);
});
