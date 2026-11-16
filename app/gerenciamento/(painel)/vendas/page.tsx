import { ChartColumn, DatabaseZap } from "lucide-react";
import { EmptyState, FilterTabs, PageHeader, ResourceList, StatCard } from "@/components/admin/blocks";
import { OrderThumb } from "@/components/admin/orders";
import { Price } from "@/components/store/price";
import { SectionLabel } from "@/components/ui/section-label";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";
import { productCover } from "@/modules/catalog/domain/product";
import { ORDER_PAYMENT_LABELS } from "@/modules/orders/domain/order";
import type { ProductSales, SalesReport } from "@/modules/orders/domain/sales-report";
import { StorageUnavailableError } from "@/modules/shared/domain/errors";
import { formatPrice } from "@/modules/shared/domain/money";

const SALES_PATH = "/gerenciamento/vendas";

type Props = { searchParams: Promise<{ ano?: string | string[] }> };

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function Header({ year }: { year?: number }) {
	return (
		<PageHeader.Root>
			<PageHeader.Content>
				<PageHeader.Title>Vendas{year ? ` de ${year}` : ""}</PageHeader.Title>
				<PageHeader.Description>
					Somente pedidos que não foram cancelados, com os valores registrados em cada um.
				</PageHeader.Description>
			</PageHeader.Content>
		</PageHeader.Root>
	);
}

/** Thin bar: units of this product next to the best seller (the numbers are written beside it). */
function UnitsBar({ product, max, total }: { product: ProductSales; max: number; total: number }) {
	const share = total > 0 ? Math.round((product.revenueInCents / total) * 100) : 0;
	return (
		<div
			aria-hidden
			title={`${product.name}: ${plural(product.units, "unidade", "unidades")} · ${formatPrice(product.revenueInCents)} (${share}% do total)`}
			className="h-2 w-full overflow-hidden rounded-full bg-muted"
		>
			<div
				className="h-full rounded-full bg-primary"
				style={{ width: `${Math.max(4, (product.units / max) * 100)}%` }}
			/>
		</div>
	);
}

function ProductsList({ report, images }: { report: SalesReport; images: Map<string, string> }) {
	const max = Math.max(...report.products.map((product) => product.units), 1);
	return (
		<ResourceList.Root aria-label="Produtos vendidos">
			{report.products.map((product) => (
				<ResourceList.Item key={product.key} className="flex-nowrap">
					<OrderThumb src={images.get(product.productId)} />
					<ResourceList.Content className="space-y-2">
						<ResourceList.Title className="whitespace-normal">{product.name}</ResourceList.Title>
						{product.sizes.length > 0 && (
							<p className="text-[13px] font-semibold text-muted-foreground">
								{product.sizes.map(({ size, units }) => `${size}: ${units}`).join(" · ")}
							</p>
						)}
						<UnitsBar product={product} max={max} total={report.totalInCents} />
					</ResourceList.Content>
					<div className="shrink-0 text-right">
						<p className="font-display text-2xl leading-none font-semibold text-foreground tabular-nums">
							{product.units}
						</p>
						<p className="mt-1 text-[11px] font-extrabold tracking-[1px] text-label uppercase">
							{product.units === 1 ? "unidade" : "unidades"}
						</p>
						<Price cents={product.revenueInCents} className="mt-1 block text-sm font-bold" />
					</div>
				</ResourceList.Item>
			))}
		</ResourceList.Root>
	);
}

export default async function SalesPage({ searchParams }: Props) {
	await requireAdminSession();
	const { ano } = await searchParams;
	const requested = typeof ano === "string" ? Number.parseInt(ano, 10) : undefined;
	const { orders, catalog } = await getRequestServices();

	let data: Awaited<ReturnType<typeof orders.salesReport>>;
	try {
		data = await orders.salesReport(Number.isFinite(requested) ? requested : undefined);
	} catch (error) {
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

	const { report, years } = data;
	const products = await catalog.listProducts();
	const images = new Map(products.map((product) => [product.id, productCover(product)]));
	const stats = [
		{ label: "Total vendido", value: <Price cents={report.totalInCents} className="text-inherit" /> },
		{ label: "Recebido", value: <Price cents={report.paidInCents} className="text-inherit" /> },
		{ label: "A receber", value: <Price cents={report.unpaidInCents} className="text-inherit" /> },
		{ label: "Itens vendidos", value: report.units },
	];

	return (
		<>
			<Header year={report.year} />

			{years.length > 1 && (
				<FilterTabs.Root aria-label="Escolher o ano">
					{years.map((year) => (
						<FilterTabs.Link key={year} href={`${SALES_PATH}?ano=${year}`} active={year === report.year}>
							{year}
						</FilterTabs.Link>
					))}
				</FilterTabs.Root>
			)}

			{report.orders === 0 ? (
				<EmptyState.Root>
					<EmptyState.Icon>
						<ChartColumn />
					</EmptyState.Icon>
					<EmptyState.Title>Nenhuma venda em {report.year}</EmptyState.Title>
					<EmptyState.Description>
						Os pedidos aparecem aqui assim que alguém finalizar o carrinho pelo WhatsApp.
					</EmptyState.Description>
				</EmptyState.Root>
			) : (
				<>
					<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
						{stats.map((stat) => (
							<StatCard.Root key={stat.label}>
								<StatCard.Label>{stat.label}</StatCard.Label>
								<StatCard.Value className="text-2xl sm:text-3xl">{stat.value}</StatCard.Value>
							</StatCard.Root>
						))}
					</div>
					<p className="mt-3 text-sm font-semibold text-muted-foreground">
						{plural(report.orders, "pedido", "pedidos")}
						{report.canceledOrders > 0 &&
							` · ${plural(report.canceledOrders, "cancelado ficou", "cancelados ficaram")} de fora`}
					</p>

					<SectionLabel className="mt-10 mb-4">Produtos vendidos</SectionLabel>
					<ProductsList report={report} images={images} />

					{report.byPayment.length > 0 && (
						<>
							<SectionLabel className="mt-10 mb-4">Recebido por meio de pagamento</SectionLabel>
							<ResourceList.Root aria-label="Recebido por meio de pagamento">
								{report.byPayment.map((entry) => (
									<ResourceList.Item key={entry.payment} className="flex-nowrap">
										<ResourceList.Content>
											<ResourceList.Title>{ORDER_PAYMENT_LABELS[entry.payment]}</ResourceList.Title>
											<ResourceList.Meta>{plural(entry.orders, "pedido", "pedidos")}</ResourceList.Meta>
										</ResourceList.Content>
										<Price cents={entry.totalInCents} className="shrink-0 font-display text-xl font-semibold" />
									</ResourceList.Item>
								))}
							</ResourceList.Root>
						</>
					)}
				</>
			)}
		</>
	);
}
