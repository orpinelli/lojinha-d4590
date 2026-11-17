import { formatPrice } from "@/modules/shared/domain/money";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "./order";

type MessageLine = { name: string; size?: string; quantity: number; priceInCents: number };

/**
 * WhatsApp text sent by the visitor. The order code lets the store find the
 * same order in the panel (Pedidos).
 */
export function buildOrderMessage({
	code,
	items,
	greeting,
	paymentMethod,
}: {
	code: string;
	items: MessageLine[];
	greeting: string;
	paymentMethod: PaymentMethod;
}): string {
	const lines = items.map(
		(item) =>
			`${item.quantity}x ${item.name}${item.size ? ` (Tamanho: ${item.size})` : ""} - ${formatPrice(item.priceInCents)}`,
	);
	const total = items.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0);
	return [
		greeting,
		"",
		`Pedido #${code}`,
		...lines,
		"",
		`Total: ${formatPrice(total)}`,
		`Pagamento: ${PAYMENT_METHOD_LABELS[paymentMethod]}`,
	].join("\n");
}
