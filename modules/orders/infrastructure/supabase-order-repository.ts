import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toDomainError } from "@/modules/shared/infrastructure/supabase-errors";
import {
	ORDER_STATUSES,
	isPaymentMethod,
	type Order,
	type OrderItem,
	type OrderPatch,
	type OrderRepository,
	type OrderStatus,
} from "../domain/order";

type OrderRow = {
	id: string;
	code: string;
	status: string;
	paid: boolean;
	payment_method: string;
	items: unknown;
	total_in_cents: number;
	customer_name: string;
	customer_club: string;
	customer_district: string;
	customer_phone: string;
	notes: string;
	created_at: string;
	updated_at: string;
};

const COLUMNS =
	"id, code, status, paid, payment_method, items, total_in_cents, customer_name, customer_club, customer_district, customer_phone, notes, created_at, updated_at";

/** `items` is JSON in the database: read it defensively. */
function toItems(raw: unknown): OrderItem[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((entry): OrderItem[] => {
		if (typeof entry !== "object" || entry === null) return [];
		const item = entry as Record<string, unknown>;
		return [
			{
				productId: String(item.productId ?? ""),
				name: String(item.name ?? ""),
				size: String(item.size ?? ""),
				quantity: Number(item.quantity) || 0,
				unitPriceInCents: Number(item.unitPriceInCents) || 0,
			},
		];
	});
}

const toStatus = (value: string): OrderStatus =>
	(ORDER_STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : "new";

const toOrder = (row: OrderRow): Order => ({
	id: row.id,
	code: row.code,
	status: toStatus(row.status),
	paid: row.paid === true,
	paymentMethod: isPaymentMethod(row.payment_method) ? row.payment_method : "",
	items: toItems(row.items),
	totalInCents: row.total_in_cents,
	customerName: row.customer_name,
	customerClub: row.customer_club,
	customerDistrict: row.customer_district,
	customerPhone: row.customer_phone,
	notes: row.notes,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

/** Only the fields that were sent, with the column names. */
const toPatchRow = ({ status, paid, paymentMethod }: OrderPatch) => ({
	...(status !== undefined && { status }),
	...(paid !== undefined && { paid }),
	...(paymentMethod !== undefined && { payment_method: paymentMethod }),
});

type Result<T> = { data: T | null; error: { code?: string; message: string } | null };

function unwrap<T>({ data, error }: Result<T>): T | null {
	if (error) throw toDomainError(error);
	return data;
}

/**
 * `public.orders`. Visitors (anon) may only insert a new order (code, items,
 * total, payment method and the optional customer details); reading and
 * changing orders is admin-only (RLS + grants).
 */
export function createSupabaseOrderRepository(client: SupabaseClient): OrderRepository {
	const table = () => client.from("orders");

	return {
		async list() {
			const rows = unwrap<OrderRow[]>(
				await table().select(COLUMNS).order("created_at", { ascending: false }),
			);
			return (rows ?? []).map(toOrder);
		},
		async findById(id) {
			const row = unwrap<OrderRow>(await table().select(COLUMNS).eq("id", id).maybeSingle());
			return row ? toOrder(row) : null;
		},
		async create(order) {
			// No `.select()`: visitors can't read orders, so nothing is returned.
			unwrap(
				await table().insert({
					code: order.code,
					items: order.items,
					total_in_cents: order.totalInCents,
					// Only sent when filled: an order without them never depends on these columns.
					...(order.paymentMethod && { payment_method: order.paymentMethod }),
					...(order.customerName && { customer_name: order.customerName }),
					...(order.customerClub && { customer_club: order.customerClub }),
					...(order.customerDistrict && { customer_district: order.customerDistrict }),
					...(order.customerPhone && { customer_phone: order.customerPhone }),
				}),
			);
		},
		async update(id, details, totalInCents) {
			const row = unwrap<OrderRow>(
				await table()
					.update({
						status: details.status,
						paid: details.paid,
						payment_method: details.paymentMethod,
						customer_name: details.customerName,
						customer_club: details.customerClub,
						customer_district: details.customerDistrict,
						customer_phone: details.customerPhone,
						notes: details.notes,
						items: details.items,
						total_in_cents: totalInCents,
					})
					.eq("id", id)
					.select(COLUMNS)
					.maybeSingle(),
			);
			return row ? toOrder(row) : null;
		},
		async patch(id, changes) {
			const row = unwrap<OrderRow>(
				await table().update(toPatchRow(changes)).eq("id", id).select(COLUMNS).maybeSingle(),
			);
			return row ? toOrder(row) : null;
		},
		async delete(id) {
			const rows = unwrap<{ id: string }[]>(await table().delete().eq("id", id).select("id"));
			return (rows?.length ?? 0) > 0;
		},
	};
}
