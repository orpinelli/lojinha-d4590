/// <reference types="vitest/globals" />
import type { Order, OrderItem } from "./order";
import {
	buildSalesReport,
	salesYearLabel,
	salesYearOf,
	salesYearRange,
	salesYears,
} from "./sales-report";

let sequence = 0;
function order(createdAt: string, items: OrderItem[], extra: Partial<Order> = {}): Order {
	sequence += 1;
	return {
		id: `o${sequence}`,
		code: `C${sequence}`,
		status: "new",
		paid: false,
		paymentMethod: "",
		customerName: "",
		customerClub: "",
		customerDistrict: "",
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

describe("store year (July → June)", () => {
	it("starts on July 1 in Brasília time", () => {
		expect(salesYearOf("2026-07-01T03:00:00Z")).toBe(2026); // 00:00 of Jul 1 in Brasília
		expect(salesYearOf("2026-07-01T02:59:00Z")).toBe(2025); // 23:59 of Jun 30 in Brasília
		expect(salesYearOf("2027-06-30T23:00:00Z")).toBe(2026); // 20:00 of Jun 30, 2027
		expect(salesYearOf("2026-01-15T12:00:00Z")).toBe(2025);
	});

	it("is shown as 2026-27, from July 1 to June 30", () => {
		expect(salesYearLabel(2026)).toBe("2026-27");
		expect(salesYearLabel(2099)).toBe("2099-00");
		expect(salesYearRange(2026)).toBe("1º de julho de 2026 a 30 de junho de 2027");
	});

	it("offers the whole history plus 3 years ahead", () => {
		expect(salesYears([], 2026)).toEqual([2026, 2027, 2028, 2029]);
		const old = [order("2025-03-10T12:00:00Z", [pin(1)])]; // year 2024-25
		expect(salesYears(old, 2028)).toEqual([2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031]);
	});
});

describe("sales report", () => {
	// newest first, as the repository returns them
	const orders = [
		order("2027-03-10T15:00:00Z", [shirt("G", 1), pin(2, "Pin Thor")], { paid: true, paymentMethod: "pix" }),
		// paid before the cart asked for the method
		order("2026-10-01T15:00:00Z", [shirt("M", 2), shirt("P", 1)], { paid: true }),
		order("2026-09-01T15:00:00Z", [pin(3)], { paymentMethod: "credit_card" }), // chosen, not paid yet
		order("2026-08-01T15:00:00Z", [shirt("M", 5)], { status: "canceled", paid: true, paymentMethod: "pix" }),
		order("2026-06-20T15:00:00Z", [pin(1)]), // still 2025-26
	];
	const report = buildSalesReport(orders, { kind: "year", start: 2026 });

	it("adds up the store year without canceled orders", () => {
		expect(report).toMatchObject({
			period: { kind: "year", start: 2026 },
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
			{ method: "", orders: 1, totalInCents: 18000 },
			{ method: "pix", orders: 1, totalInCents: 9000 },
		]);
	});

	it("groups each product with its units, money and sizes in the usual order", () => {
		expect(report.products).toEqual([
			// most recent name wins
			{ key: "4", productId: "4", name: "Pin Thor", units: 5, revenueInCents: 7500, sizes: [] },
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
		]);
	});

	it("total: every year together", () => {
		const total = buildSalesReport(orders, { kind: "all" });
		expect(total).toMatchObject({ orders: 4, canceledOrders: 1, units: 10 });
		expect(buildSalesReport(orders, { kind: "year", start: 2025 }).orders).toBe(1);
	});
});
