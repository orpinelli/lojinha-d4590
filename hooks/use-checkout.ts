"use client";

import { useCallback } from "react";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { cartTotal } from "@/modules/cart/domain/cart";
import { buildOrderMessage } from "@/modules/cart/domain/order-message";
import { whatsappMessageUrl } from "@/modules/shared/domain/whatsapp";

/** What the confirmation screen shows after the cart was sent. */
export type PlacedOrder = {
	items: CartItem[];
	totalInCents: number;
	/** Same chat, to reopen WhatsApp if it didn't open the first time. */
	whatsappUrl: string;
};

/**
 * Finishes the cart: opens WhatsApp with the order already written (number and
 * greeting come from the admin) and empties the cart. Must run inside the click
 * handler so the browser doesn't block the new tab.
 */
export function useCheckout() {
	const { items, clear } = useCart();
	const { contact } = useSiteSettings();

	return useCallback((): PlacedOrder | null => {
		if (items.length === 0) return null;
		const whatsappUrl = whatsappMessageUrl(
			contact.whatsappNumber,
			buildOrderMessage(items, contact.orderGreeting),
		);
		window.open(whatsappUrl, "_blank", "noopener,noreferrer");
		const placed: PlacedOrder = { items, totalInCents: cartTotal(items), whatsappUrl };
		clear();
		return placed;
	}, [items, clear, contact.whatsappNumber, contact.orderGreeting]);
}
