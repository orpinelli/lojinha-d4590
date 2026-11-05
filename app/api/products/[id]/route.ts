import type { NextRequest } from "next/server";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { getStorefrontServices } from "@/lib/server/container";
import { handle, noContent, ok, readJson, requireAdmin } from "@/lib/server/http";
import { revalidateStorefront } from "@/lib/server/queries";

type Context = { params: Promise<{ id: string }> };

export const GET = handle<Context>(async (_request, { params }) => {
	const { id } = await params;
	const result = await getStorefrontServices().catalog.getPublicProduct(id);
	if (!result) throw new NotFoundError("Produto não encontrado.");
	return ok(result.product);
});

export const PUT = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const { id } = await params;
	const product = await services.catalog.updateProduct(id, await readJson(request));
	revalidateStorefront();
	return ok(product);
});

export const DELETE = handle<Context>(async (request: NextRequest, { params }) => {
	const { services } = await requireAdmin(request);
	const { id } = await params;
	await services.catalog.deleteProduct(id);
	revalidateStorefront();
	return noContent();
});
