"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Price } from "@/components/store/price";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { buildOrderMessage, whatsappOrderUrl } from "@/modules/cart/domain/order-message";

export function CartSheet({ children }: { children: ReactNode }) {
	const { isOpen, setOpen } = useCart();
	return (
		<Sheet open={isOpen} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				showCloseButton={false}
				aria-describedby={undefined}
				className="border-l-2 sm:w-[400px] md:w-[440px]"
			>
				{children}
			</SheetContent>
		</Sheet>
	);
}

export function CartHeader() {
	return (
		<div className="flex h-16 shrink-0 items-center justify-between border-b-2 px-4 sm:px-6">
			<SheetTitle className="font-display text-2xl font-semibold text-foreground">Carrinho</SheetTitle>
			<SheetClose asChild>
				<Button variant="ghost" size="icon" aria-label="Fechar carrinho" className="text-label hover:text-primary">
					<X className="size-5" strokeWidth={3} />
				</Button>
			</SheetClose>
		</div>
	);
}

function CartLine({ item }: { item: CartItem }) {
	const { updateQuantity, removeItem } = useCart();
	return (
		<li className="flex gap-3 rounded-2xl border-2 p-3">
			<div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-20">
				{item.image && (
					<Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
				)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-start justify-between gap-2">
					<h3 className="line-clamp-2 text-sm font-bold text-foreground sm:text-base">{item.name}</h3>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => removeItem(item.productId, item.size)}
						aria-label={`Remover ${item.name}`}
						className="-mt-1 -mr-1 size-8 shrink-0 text-label hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 />
					</Button>
				</div>
				{item.size && (
					<p className="text-xs font-bold tracking-[0.5px] text-label uppercase">Tamanho {item.size}</p>
				)}
				<div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
					<QuantityStepper
						size="sm"
						min={0}
						value={item.quantity}
						onDecrement={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
						onIncrement={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
					/>
					<Price cents={item.priceInCents * item.quantity} className="font-display text-lg font-semibold text-primary" />
				</div>
			</div>
		</li>
	);
}

export function CartItems() {
	const { items } = useCart();
	return (
		<div className="flex-1 overflow-y-auto p-4 sm:p-6">
			{items.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-12 text-center">
					<span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
						<ShoppingCart className="size-7" strokeWidth={2.5} />
					</span>
					<p className="font-display text-xl font-semibold text-foreground">Seu carrinho está vazio</p>
					<p className="text-sm text-muted-foreground">Escolha um produto para começar.</p>
				</div>
			) : (
				<ul className="space-y-3">
					{items.map((item) => (
						<CartLine key={`${item.productId}-${item.size ?? ""}`} item={item} />
					))}
				</ul>
			)}
		</div>
	);
}

/** Total + checkout via WhatsApp (number and greeting come from the admin). */
export function CartFooter() {
	const { items, totalInCents, clear } = useCart();
	const { contact } = useSiteSettings();
	if (items.length === 0) return null;

	const checkout = () => {
		const url = whatsappOrderUrl(
			contact.whatsappNumber,
			buildOrderMessage(items, contact.orderGreeting),
		);
		clear();
		window.open(url, "_blank", "noopener,noreferrer");
	};

	return (
		<div className="border-t-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
			<div className="mb-4 flex items-center justify-between">
				<span className="text-sm font-extrabold tracking-[1px] text-label uppercase">Total</span>
				<Price cents={totalInCents} className="font-display text-3xl font-semibold text-foreground" />
			</div>
			<Button block size="lg" onClick={checkout}>
				Finalizar pedido
			</Button>
		</div>
	);
}
