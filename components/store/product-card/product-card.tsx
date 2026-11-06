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
import { Card } from "@/components/ui/card";
import { Price } from "@/components/store/price";
import { SizeSelect } from "@/components/store/size-select";
import { FeaturedBadge, ShippingBadge } from "@/components/store/store-badges";
import { Button } from "@/components/ui/button";
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
	/** Incremented on every attempt to add without a size (drives the highlight). */
	sizeAttention: number;
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
	const [sizeAttention, setSizeAttention] = useState(0);
	const add = useAddToCart();
	const addToCart = useCallback(() => {
		if (add(product, [{ size, quantity: 1 }])) {
			setSize("");
			setSizeAttention(0);
		} else if (requiresSize(product) && !size) {
			setSizeAttention((current) => current + 1);
		}
	}, [add, product, size]);
	const value = useMemo(
		() => ({ product, size, setSize, sizeAttention, addToCart }),
		[product, size, sizeAttention, addToCart],
	);

	return (
		<ProductCardContext.Provider value={value}>
			<Card
				className={cn(
					"group gap-0 overflow-hidden rounded-2xl border-2 bg-background py-0 shadow-none",
					"transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] motion-reduce:hover:translate-y-0",
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
		<div className={cn("relative aspect-square w-full overflow-hidden bg-muted", className)}>
			<Image
				src={productCover(product)}
				alt={product.name}
				fill
				sizes={sizes}
				priority={priority}
				className={cn("object-cover", imageClassName)}
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
	return <div className={cn("flex flex-1 flex-col gap-1.5 p-4", className)} {...props} />;
}

/** Bottom area separated by a border (size picker + action). */
export function ProductCardFooter({ className, ...props }: ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-col gap-3 border-t-2 px-4 pt-3 pb-4", className)} {...props} />
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
		<h3 className={cn("font-bold break-words text-foreground transition-colors", className)}>
			{product.name}
		</h3>
	);
	return linked ? (
		<Link href={productPath(product)} className="hover:text-primary">
			{title}
		</Link>
	) : (
		title
	);
}

export function ProductCardDescription({ className }: { className?: string }) {
	const { product } = useProductCard();
	if (!product.description) return null;
	return <p className={cn("text-muted-foreground", className)}>{product.description}</p>;
}

export function ProductCardPrice({ className }: { className?: string }) {
	const { product } = useProductCard();
	return <Price cents={product.priceInCents} className={cn("font-display", className)} />;
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
	const { product, size, setSize, sizeAttention } = useProductCard();
	if (!requiresSize(product)) return null;
	const invalid = sizeAttention > 0 && !size;
	return (
		<div className={className}>
			<SizeSelect
				sizes={product.sizes}
				value={size}
				onValueChange={setSize}
				placeholder={placeholder}
				triggerClassName={triggerClassName}
				invalid={invalid}
				attention={sizeAttention}
			/>
			{invalid && (
				<p role="alert" className="mt-1.5 text-xs font-bold text-destructive">
					Escolha um tamanho
				</p>
			)}
		</div>
	);
}

export function ProductCardAddButton({
	className,
	size = "sm",
	children = "Adicionar",
}: {
	className?: string;
	size?: "sm" | "md";
	children?: ReactNode;
}) {
	const { addToCart } = useProductCard();
	return (
		<Button block size={size === "md" ? "lg" : "sm"} onClick={addToCart} className={className}>
			{children}
		</Button>
	);
}

export function ProductCardDetailsLink({
	className,
	size = "md",
	children = "Ver detalhes",
}: {
	className?: string;
	size?: "sm" | "md";
	children?: ReactNode;
}) {
	const { product } = useProductCard();
	return (
		<Button asChild block variant="secondary" size={size === "md" ? "lg" : "sm"} className={className}>
			<Link href={productPath(product)}>{children}</Link>
		</Button>
	);
}

/** Seal shown on highlight cards (text = title of the "Destaque" showcase). */
export function ProductCardFeaturedBadge(props: { label?: string; className?: string }) {
	return <FeaturedBadge {...props} />;
}

export { ShippingBadge as ProductCardShippingBadge };
