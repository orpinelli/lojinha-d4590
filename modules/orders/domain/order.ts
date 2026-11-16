/**
 * Zod-free orders domain: used by the storefront checkout (browser bundle), the
 * admin and the server. Validation schemas live in ./order-schemas.
 */

export const ORDER_STATUSES = ["new", "confirmed", "delivered", "canceled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
	new: "Novo",
	confirmed: "Confirmado",
	delivered: "Entregue",
	canceled: "Cancelado",
};

/** Plural, for the filters of the orders list. */
export const ORDER_STATUS_GROUP_LABELS: Record<OrderStatus, string> = {
	new: "Novos",
	confirmed: "Confirmados",
	delivered: "Entregues",
	canceled: "Cancelados",
};

/**
 * Snapshot of a product at order time: later catalog changes (price, name)
 * don't change orders already made.
 */
export type OrderItem = {
	productId: string;
	name: string;
	/** "" when the product has no size. */
	size: string;
	quantity: number;
	unitPriceInCents: number;
};

/** Everything the admin can edit. */
export type OrderDetails = {
	status: OrderStatus;
	customerName: string;
	/** Digits only, with the country code ("" when unknown). */
	customerPhone: string;
	notes: string;
	items: OrderItem[];
};

export type Order = OrderDetails & {
	id: string;
	/** Short public code, also written in the WhatsApp message (e.g. K7P2QX). */
	code: string;
	totalInCents: number;
	createdAt: string;
	updatedAt: string;
};

/** What the storefront records when the visitor finishes the cart. */
export type NewOrder = Pick<Order, "code" | "items" | "totalInCents">;

export function orderTotal(items: Pick<OrderItem, "quantity" | "unitPriceInCents">[]): number {
	return items.reduce((total, item) => total + item.quantity * item.unitPriceInCents, 0);
}

/** Number of units (2 shirts + 1 mug = 3). */
export function orderUnits(items: Pick<OrderItem, "quantity">[]): number {
	return items.reduce((total, item) => total + item.quantity, 0);
}

/** No 0/O or 1/I/L: easy to read and type when matching a WhatsApp chat. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const ORDER_CODE_LENGTH = 6;
const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${ORDER_CODE_LENGTH}}$`);

export function isOrderCode(value: string): boolean {
	return CODE_PATTERN.test(value);
}

type RandomBytes = (size: number) => Uint8Array;
const cryptoBytes: RandomBytes = (size) => crypto.getRandomValues(new Uint8Array(size));

/**
 * Random order code (31^6 ≈ 887 million combinations). Bytes above the largest
 * multiple of the alphabet size are skipped, so every character is equally likely.
 */
export function generateOrderCode(randomBytes: RandomBytes = cryptoBytes): string {
	const limit = 256 - (256 % CODE_ALPHABET.length);
	let code = "";
	while (code.length < ORDER_CODE_LENGTH) {
		for (const byte of randomBytes(ORDER_CODE_LENGTH * 2)) {
			if (byte >= limit) continue;
			code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
			if (code.length === ORDER_CODE_LENGTH) break;
		}
	}
	return code;
}

/** Port implemented by each storage adapter. */
export interface OrderRepository {
	/** Newest first. */
	list(): Promise<Order[]>;
	findById(id: string): Promise<Order | null>;
	/**
	 * Visitors only insert (they never read orders back). Starts as "new" with
	 * empty customer fields. A repeated code throws ConflictError.
	 */
	create(order: NewOrder): Promise<void>;
	update(id: string, details: OrderDetails, totalInCents: number): Promise<Order | null>;
	updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
	delete(id: string): Promise<boolean>;
}
