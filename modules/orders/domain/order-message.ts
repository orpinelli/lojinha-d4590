import { formatPrice } from "@/modules/shared/domain/money";

type MessageLine = { name: string; size?: string; quantity: number; priceInCents: number };

/**
 * WhatsApp text sent by the visitor. The order code lets the store find the
 * same order in the panel (Pedidos).
 */
export function buildOrderMessage({
	code,
	items,
	greeting,
}: {
	code: string;
	items: MessageLine[];
	greeting: string;
}): string {
	const lines = items.map(
		(item) =>
			`${item.quantity}x ${item.name}${item.size ? ` (Tamanho: ${item.size})` : ""} - ${formatPrice(item.priceInCents)}`,
	);
	const total = items.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0);
	return `${greeting}\n\nPedido #${code}\n${lines.join("\n")}\n\nTotal: ${formatPrice(total)}`;
}
