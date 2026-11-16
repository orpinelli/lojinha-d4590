import "server-only";
import { randomUUID } from "node:crypto";
import { ConflictError } from "@/modules/shared/domain/errors";
import { createJsonFileStore } from "@/modules/shared/infrastructure/json-file-store";
import { ORDER_PAYMENTS, type Order, type OrderRepository } from "../domain/order";

/** Orders saved before a field existed get its default. */
function normalizeOrders(raw: unknown): Order[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((order: Order) => ({
		...order,
		payment: (ORDER_PAYMENTS as readonly string[]).includes(order.payment) ? order.payment : "unpaid",
		customerName: order.customerName ?? "",
		customerPhone: order.customerPhone ?? "",
	}));
}

/** File-backed adapter used in local development (`DATA_PROVIDER=local`). */
export function createLocalOrderRepository(filePath: string): OrderRepository {
	const store = createJsonFileStore<Order[]>({ filePath, seed: () => [], normalize: normalizeOrders });
	const now = () => new Date().toISOString();
	const find = async (id: string) => (await store.read()).find((order) => order.id === id);

	/** Applies a change to an existing order (no write when it doesn't exist). */
	async function change(id: string, apply: (order: Order) => Order): Promise<Order | null> {
		if (!(await find(id))) return null;
		return store.update((orders) => {
			const index = orders.findIndex((order) => order.id === id);
			if (index < 0) return null;
			orders[index] = { ...apply(orders[index]), id, updatedAt: now() };
			return orders[index];
		});
	}

	return {
		async list() {
			return (await store.read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		},
		findById: async (id) => (await find(id)) ?? null,
		async create(order) {
			await store.update((orders) => {
				if (orders.some((existing) => existing.code === order.code)) {
					throw new ConflictError("Já existe um pedido com este código.");
				}
				const timestamp = now();
				orders.push({
					...order,
					id: randomUUID(),
					status: "new",
					payment: "unpaid",
					notes: "",
					createdAt: timestamp,
					updatedAt: timestamp,
				});
			});
		},
		update: (id, details, totalInCents) =>
			change(id, (order) => ({ ...order, ...details, totalInCents })),
		patch: (id, changes) => change(id, (order) => ({ ...order, ...changes })),
		async delete(id) {
			if (!(await find(id))) return false;
			return store.update((orders) => {
				const index = orders.findIndex((order) => order.id === id);
				if (index < 0) return false;
				orders.splice(index, 1);
				return true;
			});
		},
	};
}
