"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Price } from "@/components/store/price";
import { QuantityStepper } from "@/components/store/quantity-stepper";
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
				className="sm:w-[380px] md:w-[420px] lg:w-[480px]"
			>
				{children}
			</SheetContent>
		</Sheet>
	);
}

export function CartHeader() {
	return (
		<div className="flex items-center justify-between border-b p-4 sm:p-6">
			<SheetTitle className="text-lg sm:text-xl">Carrinho</SheetTitle>
			<SheetClose asChild>
				<Button variant="ghost" className="size-10 p-0" aria-label="Fechar carrinho">
					<X className="size-4" />
				</Button>
			</SheetClose>
		</div>
	);
}

function CartLine({ item }: { item: CartItem }) {
	const { updateQuantity, removeItem } = useCart();
	return (
		<li className="flex items-center gap-3 rounded-lg border p-3 sm:gap-4 sm:p-4">
			<div className="relative size-14 shrink-0 sm:size-16">
				{item.image && (
					<Image
						src={item.image}
						alt={item.name}
						fill
						sizes="64px"
						className="rounded-md bg-muted object-cover"
					/>
				)}
			</div>
			<div className="min-w-0 flex-1">
				<h3 className="truncate text-sm font-medium text-foreground sm:text-base">{item.name}</h3>
				{item.size && (
					<p className="text-xs text-muted-foreground sm:text-sm">Tamanho: {item.size}</p>
				)}
				<Price cents={item.priceInCents} className="text-sm font-medium text-primary sm:text-base" />
				<div className="mt-2 flex items-center gap-2">
					<QuantityStepper
						size="sm"
						min={0}
						value={item.quantity}
						onDecrement={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
						onIncrement={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
					/>
					<Button
						variant="ghost"
						onClick={() => removeItem(item.productId, item.size)}
						aria-label={`Remover ${item.name}`}
						className="ml-1 size-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<X className="size-4" />
					</Button>
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
				<p className="py-8 text-center text-muted-foreground">Seu carrinho está vazio</p>
			) : (
				<ul className="space-y-3 sm:space-y-4">
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
		<div className="border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
			<div className="mb-4 flex items-center justify-between">
				<span className="text-base font-semibold text-foreground sm:text-lg">Total:</span>
				<Price cents={totalInCents} className="text-base font-bold text-primary sm:text-lg" />
			</div>
			<Button
				onClick={checkout}
				className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
			>
				Finalizar Pedido
			</Button>
		</div>
	);
}
