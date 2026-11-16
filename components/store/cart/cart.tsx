"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { CircleCheck, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
import { Price } from "@/components/store/price";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { ShippingBadge } from "@/components/store/store-badges";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { useCheckout, type PlacedOrder } from "@/hooks/use-checkout";
import { cn } from "@/lib/utils";
import { productPath } from "@/modules/catalog/domain/product";

/*
 * Cart page parts. Each state part (Loading, Empty, Review, Placed) renders
 * only in its own state, so a page composes all of them and the right one shows.
 */

type CartPageContextValue = {
	placed: PlacedOrder | null;
	checkout: () => void;
};

const CartPageContext = createContext<CartPageContextValue | null>(null);

function useCartPage() {
	const context = useContext(CartPageContext);
	if (!context) throw new Error("Use as partes do Cart dentro de <Cart.Root>");
	return context;
}

type CartState = "loading" | "empty" | "review" | "placed";

function useCartState(): CartState {
	const { ready, items } = useCart();
	const { placed } = useCartPage();
	if (placed) return "placed";
	if (!ready) return "loading";
	return items.length === 0 ? "empty" : "review";
}

export function CartRoot({ children }: { children: ReactNode }) {
	const runCheckout = useCheckout();
	const [placed, setPlaced] = useState<PlacedOrder | null>(null);
	const checkout = () => {
		const order = runCheckout();
		if (order) {
			setPlaced(order);
			window.scrollTo({ top: 0 });
		}
	};
	return (
		<CartPageContext.Provider value={{ placed, checkout }}>
			<div className="space-y-6 sm:space-y-8">{children}</div>
		</CartPageContext.Provider>
	);
}

/** Title + item count (the confirmation screen has its own heading). */
export function CartHeader() {
	const { count } = useCart();
	const state = useCartState();
	if (state === "placed") return null;
	return (
		<div className="space-y-1.5">
			<h1 className="font-display text-3xl leading-tight font-semibold text-foreground sm:text-4xl">
				Seu carrinho
			</h1>
			<p className="text-[15px] text-muted-foreground">
				{state === "review"
					? `${count} ${count === 1 ? "item" : "itens"} · confira tudo antes de finalizar.`
					: "Os produtos que você adicionar aparecem aqui."}
			</p>
		</div>
	);
}

export function CartLoading() {
	if (useCartState() !== "loading") return null;
	return (
		<div aria-busy="true" aria-label="Carregando o carrinho" className="space-y-3">
			{[0, 1].map((key) => (
				<div key={key} className="h-28 animate-pulse rounded-2xl bg-muted" />
			))}
		</div>
	);
}

export function CartEmpty() {
	if (useCartState() !== "empty") return null;
	return (
		<div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center">
			<span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
				<ShoppingCart className="size-7" strokeWidth={2.5} />
			</span>
			<p className="font-display text-2xl font-semibold text-foreground">Seu carrinho está vazio</p>
			<p className="max-w-sm text-sm text-muted-foreground">Escolha um produto na loja para começar.</p>
			<Button asChild size="lg" className="mt-3">
				<Link href="/">Ver produtos</Link>
			</Button>
		</div>
	);
}

/** Two columns on desktop: items on the left, sticky summary on the right. */
export function CartReview({ className, ...props }: ComponentProps<"div">) {
	if (useCartState() !== "review") return null;
	return (
		<div
			className={cn(
				"grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10",
				className,
			)}
			{...props}
		/>
	);
}

function CartLine({ item }: { item: CartItem }) {
	const { updateQuantity, removeItem } = useCart();
	const href = productPath({ id: item.productId });
	return (
		<li className="flex gap-3 rounded-2xl border-2 p-3 sm:gap-4 sm:p-4">
			<Link
				href={href}
				className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24"
				tabIndex={-1}
				aria-hidden
			>
				{item.image && <Image src={item.image} alt="" fill sizes="96px" className="object-cover" />}
			</Link>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-start justify-between gap-2">
					<Link
						href={href}
						className="line-clamp-2 font-bold text-foreground underline-offset-4 hover:underline sm:text-lg"
					>
						{item.name}
					</Link>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => removeItem(item.productId, item.size)}
						aria-label={`Remover ${item.name}${item.size ? ` (tamanho ${item.size})` : ""}`}
						className="-mt-1 -mr-1 size-9 shrink-0 text-label hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 />
					</Button>
				</div>
				{item.size && (
					<p className="text-xs font-bold tracking-[0.5px] text-label uppercase">Tamanho {item.size}</p>
				)}
				<div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-2">
					<QuantityStepper
						size="sm"
						min={1}
						value={item.quantity}
						itemLabel={item.name}
						onDecrement={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
						onIncrement={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
					/>
					<div className="text-right">
						<Price
							cents={item.priceInCents * item.quantity}
							className="block font-display text-xl font-semibold text-primary"
						/>
						{item.quantity > 1 && (
							<span className="text-xs font-semibold text-muted-foreground">
								<Price cents={item.priceInCents} className="text-muted-foreground" /> cada
							</span>
						)}
					</div>
				</div>
			</div>
		</li>
	);
}

export function CartLines() {
	const { items } = useCart();
	return (
		<ul aria-label="Itens do carrinho" className="space-y-3">
			{items.map((item) => (
				<CartLine key={`${item.productId}-${item.size ?? ""}`} item={item} />
			))}
		</ul>
	);
}

/** Totals + the confirm button. Sticky beside the items on desktop. */
export function CartSummary() {
	const { count, totalInCents } = useCart();
	const { checkout } = useCartPage();
	const { labels } = useSiteSettings();
	return (
		<aside
			aria-label="Resumo do pedido"
			className="space-y-5 rounded-2xl border-2 p-5 sm:p-6 lg:sticky lg:top-24"
		>
			<SectionLabel>Resumo</SectionLabel>
			<dl className="space-y-3 text-[15px]">
				<div className="flex items-center justify-between gap-3">
					<dt className="font-semibold text-muted-foreground">
						{count} {count === 1 ? "item" : "itens"}
					</dt>
					<dd>
						<Price cents={totalInCents} className="font-bold" />
					</dd>
				</div>
				<div className="flex items-center justify-between gap-3">
					<dt className="font-semibold text-muted-foreground">Entrega</dt>
					<dd className="text-right">
						{labels.shipping ? (
							<ShippingBadge />
						) : (
							<span className="font-semibold text-muted-foreground">A combinar</span>
						)}
					</dd>
				</div>
				<div className="flex items-baseline justify-between gap-3 border-t-2 pt-4">
					<dt className="text-sm font-extrabold tracking-[1px] text-label uppercase">Total</dt>
					<dd>
						<Price cents={totalInCents} className="font-display text-3xl font-semibold text-foreground" />
					</dd>
				</div>
			</dl>
			<div className="space-y-3 pb-1">
				<Button block size="lg" onClick={checkout}>
					<MessageCircle /> Finalizar pelo WhatsApp
				</Button>
				<Button asChild block variant="secondary">
					<Link href="/">Continuar comprando</Link>
				</Button>
			</div>
			<p className="text-[13px] leading-relaxed text-muted-foreground">
				O WhatsApp abre com o pedido já escrito. É só enviar a mensagem para combinar pagamento e
				entrega com a loja.
			</p>
		</aside>
	);
}

/** Shown right after checkout (the cart is already empty). */
export function CartPlaced() {
	const { placed } = useCartPage();
	if (!placed) return null;
	return (
		<div className="mx-auto max-w-xl space-y-6 rounded-2xl border-2 p-6 text-center sm:p-8">
			<span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
				<CircleCheck className="size-8" strokeWidth={2.5} />
			</span>
			<div className="space-y-2">
				<h1 className="font-display text-3xl font-semibold text-foreground">Pedido pronto!</h1>
				<p className="text-[15px] text-muted-foreground">
					Abrimos o WhatsApp com o seu pedido. Toque em enviar para a loja receber e combinar o
					pagamento e a entrega com você.
				</p>
			</div>
			<ul className="divide-y-2 rounded-2xl border-2 text-left">
				{placed.items.map((item) => (
					<li key={`${item.productId}-${item.size ?? ""}`} className="flex items-start justify-between gap-3 p-3">
						<span className="min-w-0 text-sm font-semibold text-foreground">
							{item.quantity}x {item.name}
							{item.size && <span className="text-muted-foreground"> · Tamanho {item.size}</span>}
						</span>
						<Price cents={item.priceInCents * item.quantity} className="shrink-0 text-sm font-bold" />
					</li>
				))}
				<li className="flex items-baseline justify-between gap-3 p-3">
					<span className="text-sm font-extrabold tracking-[1px] text-label uppercase">Total</span>
					<Price cents={placed.totalInCents} className="font-display text-2xl font-semibold" />
				</li>
			</ul>
			<div className="flex flex-col gap-3 pb-1 sm:flex-row sm:justify-center">
				<Button asChild variant="secondary">
					<a href={placed.whatsappUrl} target="_blank" rel="noopener noreferrer">
						<MessageCircle /> Abrir o WhatsApp de novo
					</a>
				</Button>
				<Button asChild>
					<Link href="/">Voltar para a loja</Link>
				</Button>
			</div>
		</div>
	);
}
