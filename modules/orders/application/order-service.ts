import type { ProductRepository } from "@/modules/catalog/domain/repositories";
import { ConflictError, NotFoundError, ValidationError } from "@/modules/shared/domain/errors";
import { parseInput } from "@/modules/shared/domain/validation";
import {
	ORDER_STATUSES,
	orderTotal,
	type Order,
	type OrderItem,
	type OrderRepository,
	type OrderStatus,
} from "../domain/order";
import { checkoutInputSchema, orderDetailsSchema, orderPatchSchema } from "../domain/order-schemas";
import {
	buildSalesReport,
	salesYearOf,
	salesYears,
	type SalesPeriod,
	type SalesReport,
} from "../domain/sales-report";

export type OrdersOverview = {
	/** Newest first, already filtered by status when one was given. */
	orders: Order[];
	counts: Record<OrderStatus, number>;
	total: number;
};

type Dependencies = { orders: OrderRepository; products: ProductRepository };

/** Order history: recorded at checkout, managed in the admin. */
export function createOrderService({ orders, products }: Dependencies) {
	async function get(id: string): Promise<Order> {
		const order = await orders.findById(id);
		if (!order) throw new NotFoundError("Pedido não encontrado.");
		return order;
	}

	return {
		/**
		 * Records the order the visitor is sending by WhatsApp. Names and prices
		 * come from the catalog; name and phone are optional. The same code twice
		 * (double tap) is ignored.
		 */
		async place(rawInput: unknown): Promise<{ code: string }> {
			const input = parseInput(checkoutInputSchema, rawInput);
			const catalog = new Map(
				(await products.list({ onlyActive: true })).map((product) => [product.id, product]),
			);
			const items = input.items.map((line, index): OrderItem => {
				const product = catalog.get(line.productId);
				if (!product) {
					throw new ValidationError("Um dos produtos não está mais à venda. Atualize o carrinho.", {
						[`items.${index}.productId`]: ["Produto indisponível."],
					});
				}
				return {
					productId: product.id,
					name: product.name,
					size: line.size,
					quantity: line.quantity,
					unitPriceInCents: product.priceInCents,
				};
			});
			try {
				await orders.create({
					code: input.code,
					items,
					totalInCents: orderTotal(items),
					customerName: input.customerName,
					customerPhone: input.customerPhone,
				});
			} catch (error) {
				if (!(error instanceof ConflictError)) throw error;
			}
			return { code: input.code };
		},

		/** Orders (newest first) and how many there are in each status. */
		async overview(status?: OrderStatus): Promise<OrdersOverview> {
			const all = await orders.list();
			const counts = Object.fromEntries(ORDER_STATUSES.map((value) => [value, 0])) as Record<
				OrderStatus,
				number
			>;
			for (const order of all) counts[order.status] += 1;
			return {
				orders: status ? all.filter((order) => order.status === status) : all,
				counts,
				total: all.length,
			};
		},

		get,

		/**
		 * Sales of a store year (July → June) or of every year ("all"), without
		 * canceled orders. An unknown or missing year shows the current one.
		 */
		async salesReport(
			selection?: "all" | number,
		): Promise<{ report: SalesReport; years: number[]; currentYear: number }> {
			const all = await orders.list();
			const currentYear = salesYearOf(new Date().toISOString());
			const years = salesYears(all, currentYear);
			const period: SalesPeriod =
				selection === "all"
					? { kind: "all" }
					: { kind: "year", start: selection !== undefined && years.includes(selection) ? selection : currentYear };
			return { report: buildSalesReport(all, period), years, currentYear };
		},

		async update(id: string, rawInput: unknown): Promise<Order> {
			const details = parseInput(orderDetailsSchema, rawInput);
			const updated = await orders.update(id, details, orderTotal(details.items));
			if (!updated) throw new NotFoundError("Pedido não encontrado.");
			return updated;
		},

		/** Quick change of status and/or payment. */
		async patch(id: string, rawInput: unknown): Promise<Order> {
			const changes = parseInput(orderPatchSchema, rawInput);
			const updated = await orders.patch(id, changes);
			if (!updated) throw new NotFoundError("Pedido não encontrado.");
			return updated;
		},

		async delete(id: string): Promise<void> {
			if (!(await orders.delete(id))) throw new NotFoundError("Pedido não encontrado.");
		},
	};
}

export type OrderService = ReturnType<typeof createOrderService>;
