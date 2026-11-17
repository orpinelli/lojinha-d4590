import { Package, Phone, UserRound } from "lucide-react";
import { Price } from "@/components/store/price";
import { PRODUCT_PHOTO_FRAME, ProductPhoto } from "@/components/store/product-photo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	ORDER_STATUS_LABELS,
	paymentSummary,
	type OrderDetails,
	type OrderItem,
	type OrderStatus,
} from "@/modules/orders/domain/order";
import { formatWhatsapp } from "@/modules/shared/domain/phone";

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

/** "Pago · Pix" in green, "Não pago · Pix" in amber (the method chosen in the cart). */
export function OrderPaymentBadge({ paid, paymentMethod }: Pick<OrderDetails, "paid" | "paymentMethod">) {
	return <Badge variant={paid ? "success" : "warning"}>{paymentSummary({ paid, paymentMethod })}</Badge>;
}

/** Who bought: name and phone (both optional, typed in the cart or in the admin). */
export function OrderCustomer({ name, phone }: { name: string; phone: string }) {
	if (!name && !phone) {
		return <p className="text-[13px] font-semibold text-label">Cliente não informou nome nem celular</p>;
	}
	return (
		<p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-foreground">
			{name && (
				<span className="inline-flex min-w-0 items-center gap-1.5">
					<UserRound className="size-4 shrink-0 text-label" aria-hidden />
					<span className="truncate">{name}</span>
				</span>
			)}
			{phone && (
				<span className="inline-flex items-center gap-1.5 whitespace-nowrap">
					<Phone className="size-4 shrink-0 text-label" aria-hidden />
					{formatWhatsapp(phone)}
				</span>
			)}
		</p>
	);
}

/** Orders keep only the product id: the picture comes from the current catalog. */
export function OrderThumb({ src, className }: { src?: string; className?: string }) {
	return (
		<span
			className={cn(
				"relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-label",
				src ? PRODUCT_PHOTO_FRAME : "bg-muted",
				className,
			)}
		>
			{src ? (
				<ProductPhoto src={src} sizes="64px" />
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
