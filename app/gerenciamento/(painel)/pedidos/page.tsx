import Link from "next/link";
import { ClipboardList, DatabaseZap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/actions";
import { EmptyState, FilterTabs, PageHeader, ResourceList } from "@/components/admin/blocks";
import {
	ORDERS_PATH,
	OrderCustomer,
	OrderPaymentBadge,
	OrderStatusBadge,
	OrderThumb,
	orderPath,
} from "@/components/admin/orders";
import { Price } from "@/components/store/price";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";
import { productCover } from "@/modules/catalog/domain/product";
import type { OrdersOverview } from "@/modules/orders/application/order-service";
import {
	ORDER_STATUSES,
	ORDER_STATUS_GROUP_LABELS,
	orderUnits,
	type OrderStatus,
} from "@/modules/orders/domain/order";
import { formatDateTime } from "@/modules/shared/domain/dates";
import { StorageUnavailableError } from "@/modules/shared/domain/errors";

type Props = { searchParams: Promise<{ status?: string | string[] }> };

const isStatus = (value: unknown): value is OrderStatus =>
	(ORDER_STATUSES as readonly unknown[]).includes(value);

function Header() {
	return (
		<PageHeader.Root>
			<PageHeader.Content>
				<PageHeader.Title>Pedidos</PageHeader.Title>
				<PageHeader.Description>
					Registrados quando o cliente toca em “Finalizar pelo WhatsApp”. O código do pedido vai
					na mensagem, para você achar a conversa.
				</PageHeader.Description>
			</PageHeader.Content>
		</PageHeader.Root>
	);
}

export default async function OrdersPage({ searchParams }: Props) {
	await requireAdminSession();
	const { status } = await searchParams;
	const filter = isStatus(status) ? status : undefined;
	const { orders, catalog } = await getRequestServices();

	let overview: OrdersOverview;
	try {
		overview = await orders.overview(filter);
	} catch (error) {
		// The orders table is created by a migration: explain instead of crashing.
		if (!(error instanceof StorageUnavailableError)) throw error;
		return (
			<>
				<Header />
				<EmptyState.Root>
					<EmptyState.Icon>
						<DatabaseZap />
					</EmptyState.Icon>
					<EmptyState.Title>Pedidos ainda não configurados</EmptyState.Title>
					<EmptyState.Description>{error.message}</EmptyState.Description>
				</EmptyState.Root>
			</>
		);
	}

	const products = await catalog.listProducts();
	const images = new Map(products.map((product) => [product.id, productCover(product)]));

	return (
		<>
			<Header />

			<FilterTabs.Root aria-label="Filtrar pedidos por status">
				<FilterTabs.Link href={ORDERS_PATH} active={!filter} count={overview.total}>
					Todos
				</FilterTabs.Link>
				{ORDER_STATUSES.map((value) => (
					<FilterTabs.Link
						key={value}
						href={`${ORDERS_PATH}?status=${value}`}
						active={filter === value}
						count={overview.counts[value]}
					>
						{ORDER_STATUS_GROUP_LABELS[value]}
					</FilterTabs.Link>
				))}
			</FilterTabs.Root>

			{overview.orders.length === 0 ? (
				<EmptyState.Root>
					<EmptyState.Icon>
						<ClipboardList />
					</EmptyState.Icon>
					<EmptyState.Title>
						{filter ? `Nenhum pedido em “${ORDER_STATUS_GROUP_LABELS[filter]}”` : "Nenhum pedido ainda"}
					</EmptyState.Title>
					<EmptyState.Description>
						{filter
							? "Escolha outro filtro para ver os demais pedidos."
							: "Quando alguém finalizar o carrinho pelo WhatsApp, o pedido aparece aqui."}
					</EmptyState.Description>
				</EmptyState.Root>
			) : (
				<ResourceList.Root aria-label="Pedidos">
					{overview.orders.map((order) => {
						const units = orderUnits(order.items);
						return (
							<ResourceList.Item key={order.id}>
								<OrderThumb src={images.get(order.items[0]?.productId ?? "")} className="sm:size-16" />
								<ResourceList.Content>
									<ResourceList.Title>
										<Link href={orderPath(order.id)} className="hover:underline">
											Pedido #{order.code}
										</Link>
									</ResourceList.Title>
									<OrderCustomer name={order.customerName} phone={order.customerPhone} />
									<ResourceList.Meta>
										<OrderStatusBadge status={order.status} />
										<OrderPaymentBadge payment={order.payment} />
										<span>{formatDateTime(order.createdAt)}</span>
										<span>
											{units} {units === 1 ? "item" : "itens"}
										</span>
										<Price cents={order.totalInCents} className="font-extrabold text-foreground" />
									</ResourceList.Meta>
								</ResourceList.Content>
								<ResourceList.Actions>
									<Button asChild variant="outline" size="sm">
										<Link href={orderPath(order.id)}>
											<Eye /> Ver
										</Link>
									</Button>
									<DeleteButton resource="order" id={order.id} name={`Pedido #${order.code}`} />
								</ResourceList.Actions>
							</ResourceList.Item>
						);
					})}
				</ResourceList.Root>
			)}
		</>
	);
}
