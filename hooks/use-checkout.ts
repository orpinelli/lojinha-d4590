"use client";

import { useCallback } from "react";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { storeApi } from "@/lib/api-client";
import { cartTotal } from "@/modules/cart/domain/cart";
import { generateOrderCode } from "@/modules/orders/domain/order";
import { buildOrderMessage } from "@/modules/orders/domain/order-message";
import { whatsappMessageUrl } from "@/modules/shared/domain/whatsapp";

/** Optional details the visitor typed in the cart (phone: digits with the country code). */
export type CheckoutCustomer = { name: string; phone: string };

/** What the confirmation screen shows after the cart was sent. */
export type PlacedOrder = {
	/** Also written in the WhatsApp message, to find the order in the panel. */
	code: string;
	items: CartItem[];
	totalInCents: number;
	/** Same chat, to reopen WhatsApp if it didn't open the first time. */
	whatsappUrl: string;
};

/**
 * Finishes the cart: opens WhatsApp with the order already written (number and
 * greeting come from the admin), records the order for the admin history and
 * empties the cart. Must run inside the click handler so the browser doesn't
 * block the new tab.
 */
export function useCheckout() {
	const { items, clear } = useCart();
	const { contact } = useSiteSettings();

	return useCallback((customer: CheckoutCustomer): PlacedOrder | null => {
		if (items.length === 0) return null;
		const code = generateOrderCode();
		const whatsappUrl = whatsappMessageUrl(
			contact.whatsappNumber,
			buildOrderMessage({ code, items, greeting: contact.orderGreeting }),
		);
		window.open(whatsappUrl, "_blank", "noopener,noreferrer");

		// Recorded in the background: if it fails, the WhatsApp message still has everything.
		storeApi
			.placeOrder({
				code,
				customerName: customer.name,
				customerPhone: customer.phone,
				items: items.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
			})
			.catch((error) => console.warn("[pedido] não foi registrado no painel", error));

		const placed: PlacedOrder = { code, items, totalInCents: cartTotal(items), whatsappUrl };
		clear();
		return placed;
	}, [items, clear, contact.whatsappNumber, contact.orderGreeting]);
}
