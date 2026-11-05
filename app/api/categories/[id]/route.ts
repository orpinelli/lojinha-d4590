import type { NextRequest } from "next/server";
import { handle, noContent, ok, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

type Context = { params: Promise<{ id: string }> };

export const PUT = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const { id } = await params;
	const category = await services.catalog.updateCategory(id, await readJson(request));
	revalidateStorefront();
	return ok(category);
});

export const DELETE = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const { id } = await params;
	await services.catalog.deleteCategory(id);
	revalidateStorefront();
	return noContent();
});
