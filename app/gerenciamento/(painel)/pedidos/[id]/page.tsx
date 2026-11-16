import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/actions";
import { FormSection, PageHeader } from "@/components/admin/blocks";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { ORDERS_PATH, OrderItemsList, OrderStatusBadge, orderPath } from "@/components/admin/orders";
import { Price } from "@/components/store/price";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";
import { productCover } from "@/modules/catalog/domain/product";
import { orderUnits, type Order } from "@/modules/orders/domain/order";
import { formatDateTime } from "@/modules/shared/domain/dates";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { formatWhatsapp } from "@/modules/shared/domain/phone";
import { whatsappChatUrl } from "@/modules/shared/domain/whatsapp";

type Props = { params: Promise<{ id: string }> };

function CustomerInfo({ order }: { order: Order }) {
	if (!order.customerName && !order.customerPhone && !order.notes) {
		return (
			<p className="text-sm text-muted-foreground">
				Sem dados do cliente. Em <strong className="text-foreground">Editar</strong> você anota nome,
				WhatsApp e observações.
			</p>
		);
	}
	return (
		<dl className="space-y-4 text-sm">
			{order.customerName && (
				<div className="space-y-1">
					<dt className="text-[11px] font-extrabold tracking-[1.5px] text-label uppercase">Nome</dt>
					<dd className="font-bold break-words text-foreground">{order.customerName}</dd>
				</div>
			)}
			{order.customerPhone && (
				<div className="space-y-2">
					<dt className="text-[11px] font-extrabold tracking-[1.5px] text-label uppercase">WhatsApp</dt>
					<dd className="space-y-2">
						<span className="block font-bold text-foreground">{formatWhatsapp(order.customerPhone)}</span>
						<Button asChild variant="secondary" size="sm">
							<a href={whatsappChatUrl(order.customerPhone)} target="_blank" rel="noopener noreferrer">
								<MessageCircle /> Conversar
							</a>
						</Button>
					</dd>
				</div>
			)}
			{order.notes && (
				<div className="space-y-1">
					<dt className="text-[11px] font-extrabold tracking-[1.5px] text-label uppercase">Observações</dt>
					<dd className="whitespace-pre-line break-words text-foreground">{order.notes}</dd>
				</div>
			)}
		</dl>
	);
}

export default async function OrderPage({ params }: Props) {
	await requireAdminSession();
	const { id } = await params;
	const { orders, catalog } = await getRequestServices();
	const [order, products] = await Promise.all([
		orders.get(id).catch((error) => {
			if (error instanceof NotFoundError) return null;
			throw error;
		}),
		catalog.listProducts(),
	]);
	if (!order) notFound();

	const images = new Map(products.map((product) => [product.id, productCover(product)]));
	const units = orderUnits(order.items);
	const edited = order.updatedAt !== order.createdAt;

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
						<PageHeader.Title>Pedido #{order.code}</PageHeader.Title>
						<OrderStatusBadge status={order.status} />
					</div>
					<PageHeader.Description>
						Feito em {formatDateTime(order.createdAt)}
						{edited && ` · alterado em ${formatDateTime(order.updatedAt)}`}
					</PageHeader.Description>
				</PageHeader.Content>
				<PageHeader.Actions>
					<Button asChild variant="outline">
						<Link href={`${orderPath(order.id)}/editar`}>
							<Pencil /> Editar
						</Link>
					</Button>
					<DeleteButton
						resource="order"
						id={order.id}
						name={`Pedido #${order.code}`}
						variant="button"
						redirectTo={ORDERS_PATH}
					/>
				</PageHeader.Actions>
			</PageHeader.Root>

			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
				<FormSection.Root>
					<FormSection.Header title="Itens" description={`${units} ${units === 1 ? "item" : "itens"}`} />
					<OrderItemsList items={order.items} images={images} />
					<div className="flex items-baseline justify-between gap-3 border-t-2 px-4 py-4 sm:px-6">
						<span className="text-sm font-extrabold tracking-[1px] text-label uppercase">Total</span>
						<Price cents={order.totalInCents} className="font-display text-3xl font-semibold" />
					</div>
				</FormSection.Root>

				<div className="grid grid-cols-1 gap-6">
					<FormSection.Root>
						<FormSection.Header title="Status" description="Toque para mudar. Salva na hora." />
						<FormSection.Content>
							<OrderStatusControl orderId={order.id} status={order.status} />
						</FormSection.Content>
					</FormSection.Root>
					<FormSection.Root>
						<FormSection.Header title="Cliente" />
						<FormSection.Content>
							<CustomerInfo order={order} />
						</FormSection.Content>
					</FormSection.Root>
				</div>
			</div>
		</>
	);
}
