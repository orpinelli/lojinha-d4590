"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	addCartItem,
	cartCount,
	cartTotal,
	parseStoredCart,
	reconcileCart,
	removeCartItem,
	setCartItemQuantity,
	type CartItem,
	type CatalogSnapshot,
	type NewCartItem,
} from "@/modules/cart/domain/cart";

export type { CartItem } from "@/modules/cart/domain/cart";

const STORAGE_KEY = "rotaract-cart";

type CartContextValue = {
	items: CartItem[];
	count: number;
	totalInCents: number;
	/** False until the saved cart is read from this browser (avoids an "empty cart" flash). */
	ready: boolean;
	addItem: (item: NewCartItem, quantity?: number) => void;
	removeItem: (productId: string, size?: string) => void;
	updateQuantity: (productId: string, quantity: number, size?: string) => void;
	clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let stored: CartItem[] = [];
		try {
			stored = parseStoredCart(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
			setItems(stored);
		} catch {
			// Corrupted or blocked storage: start with an empty cart.
		}
		setReady(true);

		// A saved cart may hold outdated prices: sync it with the live catalog.
		if (stored.length === 0) return;
		const controller = new AbortController();
		fetch("/api/products", { signal: controller.signal })
			.then((response) => (response.ok ? response.json() : null))
			.then((body: { data?: CatalogSnapshot[] } | null) => {
				if (body?.data) setItems((current) => reconcileCart(current, body.data ?? []));
			})
			.catch(() => {
				// Offline: keep the saved cart as is.
			});
		return () => controller.abort();
	}, []);

	useEffect(() => {
		// Only persist after loading, otherwise the empty initial state would
		// overwrite the saved cart.
		if (!ready) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		} catch {
			// Private mode / quota: the cart still works for this visit.
		}
	}, [items, ready]);

	const addItem = useCallback((item: NewCartItem, quantity = 1) => {
		setItems((current) => addCartItem(current, item, quantity));
	}, []);
	const removeItem = useCallback((productId: string, size?: string) => {
		setItems((current) => removeCartItem(current, productId, size));
	}, []);
	const updateQuantity = useCallback(
		(productId: string, quantity: number, size?: string) => {
			setItems((current) => setCartItemQuantity(current, productId, quantity, size));
		},
		[],
	);
	const clear = useCallback(() => setItems([]), []);

	const value = useMemo<CartContextValue>(
		() => ({
			items,
			count: cartCount(items),
			totalInCents: cartTotal(items),
			ready,
			addItem,
			removeItem,
			updateQuantity,
			clear,
		}),
		[items, ready, addItem, removeItem, updateQuantity, clear],
	);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
	const context = useContext(CartContext);
	if (!context) throw new Error("useCart deve ser usado dentro de <CartProvider>");
	return context;
}
