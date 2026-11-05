"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { SizeSelect } from "@/components/store/size-select";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { cn } from "@/lib/utils";
import { requiresSize, type Product } from "@/modules/catalog/domain/product";
import { formatPrice } from "@/modules/shared/domain/money";

type PurchaseContextValue = {
	product: Product;
	quantity: number;
	sizes: string[];
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
	const add = useAddToCart();

	const value: PurchaseContextValue = {
		product,
		quantity,
		sizes,
		increase: () => {
			setQuantity((current) => current + 1);
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
			add(
				product,
				needsSize ? sizes.map((size) => ({ size, quantity: 1 })) : [{ quantity }],
			);
		},
	};

	return (
		<PurchaseContext.Provider value={value}>
			<div className={cn("space-y-6 sm:space-y-8", className)}>{children}</div>
		</PurchaseContext.Provider>
	);
}

const labelClass = "block text-sm font-light tracking-wide text-muted-foreground uppercase";

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
	const { product, quantity, sizes, setSize } = usePurchase();
	if (!requiresSize(product)) return null;
	return (
		<div className="space-y-3 sm:space-y-4">
			<span className={labelClass}>
				Tamanhos {quantity > 1 && `(${quantity} itens)`}
			</span>
			<div className="space-y-2 sm:space-y-3">
				{sizes.map((size, index) => (
					<div key={index} className="flex items-center gap-2 sm:gap-3">
						<span className="w-14 shrink-0 text-xs text-muted-foreground sm:w-16 sm:text-sm">
							Item {index + 1}:
						</span>
						<SizeSelect
							sizes={product.sizes}
							value={size}
							onValueChange={(value) => setSize(index, value)}
							label={`Tamanho do item ${index + 1}`}
							triggerClassName="flex-1"
						/>
					</div>
				))}
			</div>
		</div>
	);
}

export function ProductPurchaseSubmit() {
	const { product, quantity, submit } = usePurchase();
	return (
		<Button
			size="lg"
			onClick={submit}
			className="h-auto w-full bg-primary py-4 text-sm font-light tracking-wide whitespace-normal text-primary-foreground uppercase transition-all duration-300 hover:bg-primary-hover sm:py-5"
		>
			<ShoppingCart className="size-4" />
			Adicionar ao Carrinho - {formatPrice(product.priceInCents * quantity)}
		</Button>
	);
}
