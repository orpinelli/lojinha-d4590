import type { NextRequest } from "next/server";
import { handle, noContent, ok, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

type Context = { params: Promise<{ id: string }> };

export const GET = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	return ok(await services.showcases.get((await params).id));
});

export const PUT = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const showcase = await services.showcases.update((await params).id, await readJson(request));
	revalidateStorefront();
	return ok(showcase);
});

export const DELETE = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	await services.showcases.delete((await params).id);
	revalidateStorefront();
	return noContent();
});
