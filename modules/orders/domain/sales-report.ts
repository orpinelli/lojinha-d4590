import { DEFAULT_SIZES } from "@/modules/catalog/domain/product";
import type { Order, OrderPayment } from "./order";

/** One product in the year: how many units and how much money. */
export type ProductSales = {
	/** The product id, or the name for lines added by hand without a product. */
	key: string;
	productId: string;
	/** Name in the most recent order (products can be renamed). */
	name: string;
	units: number;
	revenueInCents: number;
	/** Units per size, in the usual size order (empty when the product has no size). */
	sizes: { size: string; units: number }[];
};

export type PaymentSales = {
	payment: Exclude<OrderPayment, "unpaid">;
	orders: number;
	totalInCents: number;
};

export type SalesReport = {
	year: number;
	/** Orders of the year that count as sales (canceled ones are left out). */
	orders: number;
	units: number;
	totalInCents: number;
	paidInCents: number;
	unpaidInCents: number;
	/** Shown only as information: they are not in any number above. */
	canceledOrders: number;
	/** Most units first. */
	products: ProductSales[];
	/** Methods that received money, biggest first. */
	byPayment: PaymentSales[];
};

const SIZE_ORDER: readonly string[] = DEFAULT_SIZES;
const sizeRank = (size: string) => {
	const index = SIZE_ORDER.indexOf(size.toUpperCase());
	return index < 0 ? SIZE_ORDER.length : index;
};

/**
 * Sales of one year from the recorded orders (each order keeps the price it
 * was sold for). `orders` must be newest first; `yearOf` turns a date into
 * the store's calendar year.
 */
export function buildSalesReport(
	orders: Order[],
	year: number,
	yearOf: (iso: string) => number,
): SalesReport {
	const ofYear = orders.filter((order) => yearOf(order.createdAt) === year);
	const sold = ofYear.filter((order) => order.status !== "canceled");

	const products = new Map<string, ProductSales & { bySize: Map<string, number> }>();
	const payments = new Map<PaymentSales["payment"], PaymentSales>();
	let units = 0;
	let totalInCents = 0;
	let paidInCents = 0;

	for (const order of sold) {
		totalInCents += order.totalInCents;
		if (order.payment !== "unpaid") {
			paidInCents += order.totalInCents;
			const entry = payments.get(order.payment) ?? { payment: order.payment, orders: 0, totalInCents: 0 };
			entry.orders += 1;
			entry.totalInCents += order.totalInCents;
			payments.set(order.payment, entry);
		}
		for (const item of order.items) {
			const key = item.productId || `nome:${item.name.trim().toLowerCase()}`;
			let entry = products.get(key);
			if (!entry) {
				entry = { key, productId: item.productId, name: item.name, units: 0, revenueInCents: 0, sizes: [], bySize: new Map() };
				products.set(key, entry);
			}
			entry.units += item.quantity;
			entry.revenueInCents += item.quantity * item.unitPriceInCents;
			if (item.size) entry.bySize.set(item.size, (entry.bySize.get(item.size) ?? 0) + item.quantity);
			units += item.quantity;
		}
	}

	return {
		year,
		orders: sold.length,
		units,
		totalInCents,
		paidInCents,
		unpaidInCents: totalInCents - paidInCents,
		canceledOrders: ofYear.length - sold.length,
		products: [...products.values()]
			.map(({ bySize, ...product }) => ({
				...product,
				sizes: [...bySize]
					.map(([size, sizeUnits]) => ({ size, units: sizeUnits }))
					.sort((a, b) => sizeRank(a.size) - sizeRank(b.size) || a.size.localeCompare(b.size, "pt-BR")),
			}))
			.sort(
				(a, b) =>
					b.units - a.units ||
					b.revenueInCents - a.revenueInCents ||
					a.name.localeCompare(b.name, "pt-BR"),
			),
		byPayment: [...payments.values()].sort((a, b) => b.totalInCents - a.totalInCents),
	};
}

/** Years that have orders, newest first; the current year is always offered. */
export function salesYears(orders: Order[], currentYear: number, yearOf: (iso: string) => number): number[] {
	const years = new Set([currentYear]);
	for (const order of orders) {
		const year = yearOf(order.createdAt);
		if (Number.isFinite(year)) years.add(year);
	}
	return [...years].sort((a, b) => b - a);
}

