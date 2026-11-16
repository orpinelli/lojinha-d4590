import { DEFAULT_SIZES } from "@/modules/catalog/domain/product";
import { brazilYearMonth } from "@/modules/shared/domain/dates";
import type { Order, OrderPayment } from "./order";

/**
 * The store's year runs from July 1 to June 30 (like the Rotary year), in
 * Brasília time: "2026" means Jul 1, 2026 – Jun 30, 2027 (shown as 2026-27).
 */
export const SALES_YEAR_START_MONTH = 7;

/** How many years ahead the filter always offers. */
export const FUTURE_SALES_YEARS = 3;

/** First calendar year of the store year of a date: Jun 30, 2027 → 2026; Jul 1, 2027 → 2027. */
export function salesYearOf(iso: string): number {
	const date = brazilYearMonth(iso);
	if (!date) return Number.NaN;
	return date.month >= SALES_YEAR_START_MONTH ? date.year : date.year - 1;
}

/** 2026 → "2026-27". */
export function salesYearLabel(start: number): string {
	return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** 2026 → "1º de julho de 2026 a 30 de junho de 2027". */
export function salesYearRange(start: number): string {
	return `1º de julho de ${start} a 30 de junho de ${start + 1}`;
}

/** One store year, or every order since the beginning. */
export type SalesPeriod = { kind: "year"; start: number } | { kind: "all" };

/**
 * Years offered in the filter, oldest first: the whole history (since the
 * first order) up to FUTURE_SALES_YEARS after the current one. New years show
 * up by themselves as time goes by.
 */
export function salesYears(orders: Order[], currentYear: number, yearOf = salesYearOf): number[] {
	let first = currentYear;
	for (const order of orders) {
		const year = yearOf(order.createdAt);
		if (Number.isFinite(year) && year < first) first = year;
	}
	return Array.from({ length: currentYear + FUTURE_SALES_YEARS - first + 1 }, (_, index) => first + index);
}

/** One product in the period: how many units and how much money. */
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
	period: SalesPeriod;
	/** Orders of the period that count as sales (canceled ones are left out). */
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
 * Sales of a period from the recorded orders (each order keeps the price it
 * was sold for). `orders` must be newest first.
 */
export function buildSalesReport(
	orders: Order[],
	period: SalesPeriod,
	yearOf = salesYearOf,
): SalesReport {
	const inPeriod =
		period.kind === "all" ? orders : orders.filter((order) => yearOf(order.createdAt) === period.start);
	const sold = inPeriod.filter((order) => order.status !== "canceled");

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
		period,
		orders: sold.length,
		units,
		totalInCents,
		paidInCents,
		unpaidInCents: totalInCents - paidInCents,
		canceledOrders: inPeriod.length - sold.length,
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
