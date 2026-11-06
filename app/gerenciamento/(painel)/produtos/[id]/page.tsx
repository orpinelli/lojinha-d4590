import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/actions";
import { PageHeader } from "@/components/admin/blocks";
import { ProductForm } from "@/components/admin/product-form";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";
import { productPath } from "@/modules/catalog/domain/product";
import { NotFoundError } from "@/modules/shared/domain/errors";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
	await requireAdminSession();
	const { id } = await params;
	const { catalog, showcases } = await getRequestServices();
	const [product, categories, showcaseTitles] = await Promise.all([
		catalog.getProduct(id).catch((error) => {
			if (error instanceof NotFoundError) return null;
			throw error;
		}),
		catalog.listCategories(),
		showcases.titlesForProduct(id),
	]);
	if (!product) notFound();

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>{product.name}</PageHeader.Title>
					<PageHeader.Description>Editar produto</PageHeader.Description>
				</PageHeader.Content>
				<PageHeader.Actions>
					{product.active && (
						<Button asChild variant="outline">
							<a href={productPath(product)} target="_blank" rel="noopener noreferrer">
								<ExternalLink /> Ver na loja
							</a>
						</Button>
					)}
					<DeleteButton
						resource="product"
						id={product.id}
						name={product.name}
						variant="button"
						redirectTo="/gerenciamento/produtos"
					/>
				</PageHeader.Actions>
			</PageHeader.Root>

			<ProductForm
				product={product}
				categories={categories.map(({ id, name }) => ({ id, name }))}
				showcaseTitles={showcaseTitles}
			/>
		</>
	);
}
