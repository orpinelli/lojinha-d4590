import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/blocks";
import { OrderForm } from "@/components/admin/order-form";
import { orderPath } from "@/components/admin/orders";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";
import { byPositionThenName, isAvailable } from "@/modules/catalog/domain/product";
import { formatDateTime } from "@/modules/shared/domain/dates";
import { NotFoundError } from "@/modules/shared/domain/errors";

type Props = { params: Promise<{ id: string }> };

export default async function EditOrderPage({ params }: Props) {
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

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Editar pedido #{order.code}</PageHeader.Title>
					<PageHeader.Description>Feito em {formatDateTime(order.createdAt)}</PageHeader.Description>
				</PageHeader.Content>
			</PageHeader.Root>

			<OrderForm
				order={order}
				products={[...products]
					.sort(byPositionThenName)
					.map((product) => ({
						id: product.id,
						name: product.name,
						priceInCents: product.priceInCents,
						active: isAvailable(product),
					}))}
				cancelHref={orderPath(order.id)}
			/>
		</>
	);
}
