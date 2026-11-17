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

/** How the customer will pay: chosen in the cart, can be changed in the admin. */
export const PAYMENT_METHODS = ["pix", "credit_card", "debit_card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** "" = not informed (orders made before the cart asked for it). */
export type OrderPaymentMethod = PaymentMethod | "";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
	pix: "Pix",
	credit_card: "Cartão de crédito",
	debit_card: "Cartão de débito",
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
	return (PAYMENT_METHODS as readonly unknown[]).includes(value);
}

export function paymentMethodLabel(method: OrderPaymentMethod): string {
	return method ? PAYMENT_METHOD_LABELS[method] : "Não informado";
}

/** "Pago · Pix", "Não pago · Cartão de crédito" or just "Não pago" when the method is unknown. */
export function paymentSummary({ paid, paymentMethod }: Pick<OrderDetails, "paid" | "paymentMethod">): string {
	const status = paid ? "Pago" : "Não pago";
	return paymentMethod ? `${status} · ${PAYMENT_METHOD_LABELS[paymentMethod]}` : status;
}

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
	/** Marked by the admin when the money arrives. */
	paid: boolean;
	paymentMethod: OrderPaymentMethod;
	/** Optional, typed by the customer in the cart or by the admin. */
	customerName: string;
	/** Optional, like the name. */
	customerClub: string;
	/** Optional, like the name. */
	customerDistrict: string;
	/** Digits only, with the country code ("" when not informed). */
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
export type NewOrder = Pick<
	Order,
	| "code"
	| "items"
	| "totalInCents"
	| "paymentMethod"
	| "customerName"
	| "customerClub"
	| "customerDistrict"
	| "customerPhone"
>;

/** Quick changes made from the order page (one tap). */
export type OrderPatch = Partial<Pick<OrderDetails, "status" | "paid">> & { paymentMethod?: PaymentMethod };

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
	 * Visitors only insert (they never read orders back). Starts as "new" and
	 * not paid. A repeated code throws ConflictError.
	 */
	create(order: NewOrder): Promise<void>;
	update(id: string, details: OrderDetails, totalInCents: number): Promise<Order | null>;
	patch(id: string, changes: OrderPatch): Promise<Order | null>;
	delete(id: string): Promise<boolean>;
}
