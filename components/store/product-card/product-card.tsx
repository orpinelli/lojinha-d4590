"use client";

import Image from "next/image";
import Link from "next/link";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ComponentProps,
	type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Price } from "@/components/store/price";
import { SizeSelect } from "@/components/store/size-select";
import { FeaturedBadge, ShippingBadge } from "@/components/store/store-badges";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { cn } from "@/lib/utils";
import {
	productCover,
	productPath,
	requiresSize,
	type Product,
} from "@/modules/catalog/domain/product";

type ProductCardContextValue = {
	product: Product;
	size: string;
	setSize: (size: string) => void;
	addToCart: () => void;
};

const ProductCardContext = createContext<ProductCardContextValue | null>(null);

function useProductCard() {
	const context = useContext(ProductCardContext);
	if (!context) throw new Error("Use as partes do ProductCard dentro de <ProductCard.Root>");
	return context;
}

/** Holds the product and the selected size; every part reads from it. */
export function ProductCardRoot({
	product,
	className,
	children,
	...props
}: ComponentProps<typeof Card> & { product: Product }) {
	const [size, setSize] = useState("");
	const add = useAddToCart();
	const addToCart = useCallback(() => {
		if (add(product, [{ size, quantity: 1 }])) setSize("");
	}, [add, product, size]);
	const value = useMemo(
		() => ({ product, size, setSize, addToCart }),
		[product, size, addToCart],
	);

	return (
		<ProductCardContext.Provider value={value}>
			<Card
				className={cn(
					"group overflow-hidden rounded-lg bg-background transition-all duration-300",
					className,
				)}
				{...props}
			>
				{children}
			</Card>
		</ProductCardContext.Provider>
	);
}

export function ProductCardMedia({
	className,
	imageClassName,
	sizes = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw",
	priority,
	linked = true,
}: {
	className?: string;
	imageClassName?: string;
	sizes?: string;
	priority?: boolean;
	linked?: boolean;
}) {
	const { product } = useProductCard();
	const media = (
		<div className={cn("relative aspect-square w-full bg-muted", className)}>
			<Image
				src={productCover(product)}
				alt={product.name}
				fill
				sizes={sizes}
				priority={priority}
				className={cn(
					"object-cover transition-transform duration-300 group-hover:scale-105",
					imageClassName,
				)}
			/>
		</div>
	);
	if (!linked) return media;
	return (
		<Link href={productPath(product)} tabIndex={-1} aria-hidden>
			{media}
		</Link>
	);
}

export function ProductCardBody({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn("flex flex-1 flex-col justify-between bg-background p-4 sm:p-5", className)}
			{...props}
		/>
	);
}

export function ProductCardTitle({
	className,
	linked = true,
}: {
	className?: string;
	linked?: boolean;
}) {
	const { product } = useProductCard();
	const title = (
		<h3 className={cn("break-words text-foreground transition-colors", className)}>
			{product.name}
		</h3>
	);
	return linked ? <Link href={productPath(product)}>{title}</Link> : title;
}

export function ProductCardDescription({ className }: { className?: string }) {
	const { product } = useProductCard();
	if (!product.description) return null;
	return <p className={cn("text-muted-foreground", className)}>{product.description}</p>;
}

export function ProductCardPrice({ className }: { className?: string }) {
	const { product } = useProductCard();
	return <Price cents={product.priceInCents} className={className} />;
}

export function ProductCardSizePicker({
	className,
	triggerClassName,
	placeholder,
}: {
	className?: string;
	triggerClassName?: string;
	placeholder?: string;
}) {
	const { product, size, setSize } = useProductCard();
	if (!requiresSize(product)) return null;
	return (
		<div className={className}>
			<SizeSelect
				sizes={product.sizes}
				value={size}
				onValueChange={setSize}
				placeholder={placeholder}
				triggerClassName={triggerClassName}
			/>
		</div>
	);
}

export function ProductCardAddButton({
	className,
	children = "Adicionar",
}: {
	className?: string;
	children?: ReactNode;
}) {
	const { addToCart } = useProductCard();
	return (
		<Button
			type="button"
			onClick={addToCart}
			className={cn(
				"h-auto min-h-9 w-full whitespace-normal bg-primary tracking-wide text-primary-foreground uppercase transition-all duration-300 hover:bg-primary-hover",
				className,
			)}
		>
			{children}
		</Button>
	);
}

export function ProductCardDetailsLink({
	className,
	children = "Ver Detalhes",
}: {
	className?: string;
	children?: ReactNode;
}) {
	const { product } = useProductCard();
	return (
		<Button
			asChild
			variant="outline"
			className={cn(
				"h-auto min-h-9 w-full whitespace-normal border-foreground text-sm font-light tracking-wide text-foreground uppercase transition-all duration-300 hover:bg-foreground hover:text-background",
				className,
			)}
		>
			<Link href={productPath(product)}>{children}</Link>
		</Button>
	);
}

export { FeaturedBadge as ProductCardFeaturedBadge, ShippingBadge as ProductCardShippingBadge };
