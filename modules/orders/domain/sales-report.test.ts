/// <reference types="vitest/globals" />
import { yearInBrazil } from "@/modules/shared/domain/dates";
import type { Order, OrderItem } from "./order";
import { buildSalesReport, salesYears } from "./sales-report";

let sequence = 0;
function order(createdAt: string, items: OrderItem[], extra: Partial<Order> = {}): Order {
	sequence += 1;
	return {
		id: `o${sequence}`,
		code: `C${sequence}`,
		status: "new",
		payment: "unpaid",
		customerName: "",
		customerPhone: "",
		notes: "",
		items,
		totalInCents: items.reduce((sum, item) => sum + item.quantity * item.unitPriceInCents, 0),
		createdAt,
		updatedAt: createdAt,
		...extra,
	};
}

const shirt = (size: string, quantity: number): OrderItem => ({
	productId: "12",
	name: "Camiseta rosa",
	size,
	quantity,
	unitPriceInCents: 6000,
});
const pin = (quantity: number, name = "Pin"): OrderItem => ({
	productId: "4",
	name,
	size: "",
	quantity,
	unitPriceInCents: 1500,
});

describe("sales report", () => {
	// newest first, as the repository returns them
	const orders = [
		order("2026-11-10T15:00:00Z", [shirt("G", 1), pin(2, "Pin Thor")], { payment: "pix" }),
		order("2026-10-01T15:00:00Z", [shirt("M", 2), shirt("P", 1)], { payment: "cash" }),
		order("2026-09-01T15:00:00Z", [pin(3)]),
		order("2026-08-01T15:00:00Z", [shirt("M", 5)], { status: "canceled", payment: "pix" }),
		order("2025-12-20T15:00:00Z", [pin(1)]),
	];
	const report = buildSalesReport(orders, 2026, yearInBrazil);

	it("adds up the year without canceled orders", () => {
		expect(report).toMatchObject({
			year: 2026,
			orders: 3,
			canceledOrders: 1,
			units: 9,
			totalInCents: 4 * 6000 + 5 * 1500,
		});
	});

	it("splits received and still to receive", () => {
		expect(report.paidInCents).toBe(6000 + 3000 + 3 * 6000);
		expect(report.unpaidInCents).toBe(4500);
		expect(report.byPayment).toEqual([
			{ payment: "cash", orders: 1, totalInCents: 18000 },
			{ payment: "pix", orders: 1, totalInCents: 9000 },
		]);
	});

	it("groups each product with its units, money and sizes in the usual order", () => {
		expect(report.products).toEqual([
			{
				key: "12",
				productId: "12",
				name: "Camiseta rosa",
				units: 4,
				revenueInCents: 24000,
				sizes: [
					{ size: "P", units: 1 },
					{ size: "M", units: 2 },
					{ size: "G", units: 1 },
				],
			},
			// most recent name wins
			{ key: "4", productId: "4", name: "Pin Thor", units: 5, revenueInCents: 7500, sizes: [] },
		].sort((a, b) => b.units - a.units));
	});

	it("uses Brasília time: 22h on Dec 31 still belongs to that year", () => {
		const newYearsEve = [order("2027-01-01T01:00:00Z", [pin(1)])];
		expect(buildSalesReport(newYearsEve, 2026, yearInBrazil).orders).toBe(1);
		expect(buildSalesReport(newYearsEve, 2027, yearInBrazil).orders).toBe(0);
	});

	it("offers the years that have orders plus the current one", () => {
		expect(salesYears(orders, 2027, yearInBrazil)).toEqual([2027, 2026, 2025]);
	});
});
