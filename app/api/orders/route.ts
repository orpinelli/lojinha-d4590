import type { NextRequest } from "next/server";
import { getStorefrontServices } from "@/lib/server/container";
import { assertSameOrigin, clientIp, handle, ok, readJson, requireAdmin } from "@/lib/server/http";
import { orderLimiter } from "@/lib/server/rate-limit";
import { ORDER_STATUSES, type OrderStatus } from "@/modules/orders/domain/order";

/** Admin: every order, newest first. `?status=new` filters. */
export const GET = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);
	const status = request.nextUrl.searchParams.get("status");
	const filter = (ORDER_STATUSES as readonly string[]).includes(status ?? "")
		? (status as OrderStatus)
		: undefined;
	return ok((await services.orders.overview(filter)).orders);
});

/**
 * Public: the cart records the order it is sending by WhatsApp. Only ids,
 * sizes and quantities are accepted; prices come from the catalog.
 */
export const POST = handle(async (request: NextRequest) => {
	assertSameOrigin(request);
	orderLimiter.hit(clientIp(request));
	const placed = await getStorefrontServices().orders.place(await readJson(request));
	return ok(placed, 201);
});
