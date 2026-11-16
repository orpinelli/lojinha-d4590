import type { NextRequest } from "next/server";
import { handle, noContent, ok, readJson, requireAdmin } from "@/lib/server/http";

type Context = { params: Promise<{ id: string }> };

export const GET = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const { id } = await params;
	return ok(await services.orders.get(id));
});

/** Full edit (status, customer, notes and items). The total is recalculated. */
export const PUT = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const { id } = await params;
	return ok(await services.orders.update(id, await readJson(request)));
});

/** Quick status change: `{ "status": "confirmed" }`. */
export const PATCH = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const { id } = await params;
	return ok(await services.orders.updateStatus(id, await readJson(request)));
});

export const DELETE = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const { id } = await params;
	await services.orders.delete(id);
	return noContent();
});
