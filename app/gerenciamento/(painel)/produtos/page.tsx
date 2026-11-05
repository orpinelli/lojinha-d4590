import Image from "next/image";
import Link from "next/link";
import { Package, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/actions";
import { EmptyState, PageHeader, ResourceList } from "@/components/admin/blocks";
import { Price } from "@/components/store/price";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";
import { productCover } from "@/modules/catalog/domain/product";

const editPath = (id: string) => `/gerenciamento/produtos/${encodeURIComponent(id)}`;

export default async function ProductsPage() {
	await requireAdminSession();
	const { catalog } = await getRequestServices();
	const [products, categories] = await Promise.all([
		catalog.listProducts(),
		catalog.listCategories(),
	]);
	const categoryById = new Map(categories.map((category) => [category.id, category]));
	const sorted = [...products].sort(
		(a, b) =>
			(categoryById.get(a.categoryId)?.position ?? Number.MAX_SAFE_INTEGER) -
				(categoryById.get(b.categoryId)?.position ?? Number.MAX_SAFE_INTEGER) ||
			a.position - b.position ||
			a.name.localeCompare(b.name, "pt-BR"),
	);

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Produtos</PageHeader.Title>
					<PageHeader.Description>{products.length} cadastrado(s)</PageHeader.Description>
				</PageHeader.Content>
				<PageHeader.Actions>
					<Button asChild className="h-10">
						<Link href="/gerenciamento/produtos/novo">
							<Plus /> Novo produto
						</Link>
					</Button>
				</PageHeader.Actions>
			</PageHeader.Root>

			{sorted.length === 0 ? (
				<EmptyState.Root>
					<EmptyState.Icon>
						<Package />
					</EmptyState.Icon>
					<EmptyState.Title>Nenhum produto ainda</EmptyState.Title>
					<EmptyState.Description>Cadastre o primeiro produto da loja.</EmptyState.Description>
				</EmptyState.Root>
			) : (
				<ResourceList.Root>
					{sorted.map((product) => (
						<ResourceList.Item key={product.id}>
							<ResourceList.Media>
								<Image src={productCover(product)} alt="" fill sizes="64px" className="object-cover" />
							</ResourceList.Media>
							<ResourceList.Content>
								<ResourceList.Title>
									<Link href={editPath(product.id)} className="hover:underline">
										{product.name}
									</Link>
								</ResourceList.Title>
								<ResourceList.Meta>
									<span>{categoryById.get(product.categoryId)?.name ?? "Sem categoria"}</span>
									<Price cents={product.priceInCents} className="font-medium" />
									{!product.active && <Badge variant="outline">Oculto</Badge>}
									{product.featured && <Badge>Destaque</Badge>}
								</ResourceList.Meta>
							</ResourceList.Content>
							<ResourceList.Actions>
								<Button asChild variant="outline" className="h-10 hover:bg-muted hover:text-foreground">
									<Link href={editPath(product.id)}>
										<Pencil /> Editar
									</Link>
								</Button>
								<DeleteButton resource="product" id={product.id} name={product.name} />
							</ResourceList.Actions>
						</ResourceList.Item>
					))}
				</ResourceList.Root>
			)}
		</>
	);
}
