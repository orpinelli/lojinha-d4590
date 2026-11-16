import { normalizeWhatsapp } from "./phone";

/** Opens a chat with the number (no pre-filled message). */
export function whatsappChatUrl(phoneNumber: string): string {
	return `https://wa.me/${normalizeWhatsapp(phoneNumber)}`;
}

/** Opens a chat with the message already typed (the visitor only taps send). */
export function whatsappMessageUrl(phoneNumber: string, message: string): string {
	return `${whatsappChatUrl(phoneNumber)}?text=${encodeURIComponent(message)}`;
}
