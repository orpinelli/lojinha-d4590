"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/contexts/cart-context";
import { productCover, requiresSize, type Product } from "@/modules/catalog/domain/product";

export type CartLine = { size?: string; quantity: number };

/**
 * Shared "add to cart" rule for every product UI (cards, featured, product
 * page): validates sizes, adds each line and gives feedback.
 */
export function useAddToCart() {
	const { addItem } = useCart();
	const { showToast } = useToast();

	return useCallback(
		(product: Product, lines: CartLine[]): boolean => {
			if (requiresSize(product) && lines.some((line) => !line.size)) {
				showToast({
					type: "warning",
					title: "Tamanho obrigatório",
					message: "Selecione o tamanho antes de adicionar ao carrinho.",
				});
				return false;
			}
			for (const line of lines) {
				addItem(
					{
						productId: product.id,
						name: product.name,
						priceInCents: product.priceInCents,
						image: productCover(product),
						size: line.size || undefined,
					},
					line.quantity,
				);
			}
			showToast({
				type: "success",
				title: "Produto adicionado",
				message: "Produto adicionado ao carrinho com sucesso!",
			});
			return true;
		},
		[addItem, showToast],
	);
}
