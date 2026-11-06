"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ShoppingCart } from "lucide-react";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { SizeSelect } from "@/components/store/size-select";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { cn } from "@/lib/utils";
import { requiresSize, type Product } from "@/modules/catalog/domain/product";
import { formatPrice } from "@/modules/shared/domain/money";

type PurchaseContextValue = {
	product: Product;
	quantity: number;
	sizes: string[];
	/** Incremented on every attempt to add with missing sizes. */
	attention: number;
	increase: () => void;
	decrease: () => void;
	setSize: (index: number, size: string) => void;
	submit: () => void;
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

function usePurchase() {
	const context = useContext(PurchaseContext);
	if (!context) throw new Error("Use as partes do ProductPurchase dentro de <ProductPurchase.Root>");
	return context;
}

/** Quantity + one size per unit (for clothing) + add to cart. */
export function ProductPurchaseRoot({
	product,
	className,
	children,
}: {
	product: Product;
	className?: string;
	children: ReactNode;
}) {
	const needsSize = requiresSize(product);
	const [quantity, setQuantity] = useState(1);
	const [sizes, setSizes] = useState<string[]>(needsSize ? [""] : []);
	const [attention, setAttention] = useState(0);
	const add = useAddToCart();

	const value: PurchaseContextValue = {
		product,
		quantity,
		sizes,
		attention,
		increase: () => {
			setQuantity((current) => current + 1);
			setAttention(0);
			if (needsSize) setSizes((current) => [...current, ""]);
		},
		decrease: () => {
			if (quantity <= 1) return;
			setQuantity((current) => current - 1);
			if (needsSize) setSizes((current) => current.slice(0, -1));
		},
		setSize: (index, size) =>
			setSizes((current) => current.map((value, i) => (i === index ? size : value))),
		submit: () => {
			const added = add(
				product,
				needsSize ? sizes.map((size) => ({ size, quantity: 1 })) : [{ quantity }],
			);
			setAttention((current) => (added ? 0 : current + 1));
		},
	};

	return (
		<PurchaseContext.Provider value={value}>
			<div className={cn("space-y-6 sm:space-y-8", className)}>{children}</div>
		</PurchaseContext.Provider>
	);
}

const labelClass = "block text-sm font-bold tracking-[0.5px] text-label uppercase";

export function ProductPurchaseQuantity() {
	const { quantity, increase, decrease } = usePurchase();
	return (
		<div className="space-y-2 sm:space-y-3">
			<span className={labelClass}>Quantidade</span>
			<QuantityStepper value={quantity} onDecrement={decrease} onIncrement={increase} />
		</div>
	);
}

export function ProductPurchaseSizes() {
	const { product, quantity, sizes, setSize, attention } = usePurchase();
	if (!requiresSize(product)) return null;
	const firstMissing = sizes.findIndex((size) => !size);
	return (
		<div className="space-y-3 sm:space-y-4">
			<span className={labelClass}>
				Tamanhos {quantity > 1 && `(${quantity} itens)`}
			</span>
			<div className="space-y-2 sm:space-y-3">
				{sizes.map((size, index) => (
					<div key={index} className="flex items-center gap-2 sm:gap-3">
						<span className="w-14 shrink-0 text-xs font-bold text-label uppercase sm:w-16">
							Item {index + 1}:
						</span>
						<SizeSelect
							sizes={product.sizes}
							value={size}
							onValueChange={(value) => setSize(index, value)}
							label={`Tamanho do item ${index + 1}`}
							triggerClassName="flex-1"
							invalid={attention > 0 && !size}
							attention={attention}
							focusOnAttention={index === firstMissing}
						/>
					</div>
				))}
			</div>
			{attention > 0 && firstMissing >= 0 && (
				<p role="alert" className="text-sm font-bold text-destructive">
					Escolha o tamanho de cada item.
				</p>
			)}
		</div>
	);
}

export function ProductPurchaseSubmit() {
	const { product, quantity, submit } = usePurchase();
	return (
		<Button block size="lg" onClick={submit} className="min-h-14 text-base">
			<ShoppingCart className="size-5" strokeWidth={2.5} />
			Adicionar ao carrinho · {formatPrice(product.priceInCents * quantity)}
		</Button>
	);
}
