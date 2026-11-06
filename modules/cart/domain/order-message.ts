import { formatPrice } from "@/modules/shared/domain/money";
import { cartTotal, type CartItem } from "./cart";

export function buildOrderMessage(items: CartItem[], greeting: string): string {
	const lines = items.map(
		(item) =>
			`${item.quantity}x ${item.name}${item.size ? ` (Tamanho: ${item.size})` : ""} - ${formatPrice(item.priceInCents)}`,
	);
	return `${greeting}\n\n${lines.join("\n")}\n\nTotal: ${formatPrice(cartTotal(items))}`;
}

/** Opens a chat with the store (no pre-filled message). */
export function whatsappChatUrl(phoneNumber: string): string {
	return `https://wa.me/${phoneNumber.replace(/\D/g, "")}`;
}

export function whatsappOrderUrl(phoneNumber: string, message: string): string {
	return `${whatsappChatUrl(phoneNumber)}?text=${encodeURIComponent(message)}`;
}
