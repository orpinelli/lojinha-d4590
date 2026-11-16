import Image from "next/image";
import { Package } from "lucide-react";
import { Price } from "@/components/store/price";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderItem, type OrderStatus } from "@/modules/orders/domain/order";

/* Server-compatible pieces shared by the order pages of the admin. */

export const ORDERS_PATH = "/gerenciamento/pedidos";
export const orderPath = (id: string) => `${ORDERS_PATH}/${encodeURIComponent(id)}`;

const STATUS_BADGE = {
	new: "info",
	confirmed: "default",
	delivered: "success",
	canceled: "secondary",
} as const satisfies Record<OrderStatus, string>;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
	return <Badge variant={STATUS_BADGE[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

/** Orders keep only the product id: the picture comes from the current catalog. */
export function OrderThumb({ src, className }: { src?: string; className?: string }) {
	return (
		<span
			className={cn(
				"relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-label",
				className,
			)}
		>
			{src ? (
				<Image src={src} alt="" fill sizes="64px" className="object-cover" />
			) : (
				<Package className="size-6" aria-hidden />
			)}
		</span>
	);
}

/** Read-only items of an order, with the line totals. */
export function OrderItemsList({
	items,
	images,
}: {
	items: OrderItem[];
	images: Map<string, string>;
}) {
	return (
		<ul className="divide-y-2">
			{items.map((item, index) => (
				<li key={`${item.productId}-${item.size}-${index}`} className="flex items-center gap-3 px-4 py-3 sm:px-6">
					<OrderThumb src={images.get(item.productId)} />
					<div className="min-w-0 flex-1">
						<p className="font-bold break-words text-foreground">{item.name}</p>
						<p className="text-[13px] font-semibold text-muted-foreground">
							{item.size && `Tamanho ${item.size} · `}
							{item.quantity} × <Price cents={item.unitPriceInCents} className="text-muted-foreground" />
						</p>
					</div>
					<Price cents={item.quantity * item.unitPriceInCents} className="shrink-0 font-extrabold" />
				</li>
			))}
		</ul>
	);
}
