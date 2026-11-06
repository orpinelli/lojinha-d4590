import Link from "next/link";
import { Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/admin/blocks";
import { ProductForm } from "@/components/admin/product-form";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";

export default async function NewProductPage() {
	await requireAdminSession();
	const { catalog } = await getRequestServices();
	const categories = await catalog.listCategories();

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Novo produto</PageHeader.Title>
					<PageHeader.Description>Preencha as informações e salve.</PageHeader.Description>
				</PageHeader.Content>
			</PageHeader.Root>

			{categories.length === 0 ? (
				<EmptyState.Root>
					<EmptyState.Icon>
						<Tags />
					</EmptyState.Icon>
					<EmptyState.Title>Crie uma categoria primeiro</EmptyState.Title>
					<EmptyState.Description>Todo produto pertence a uma categoria da loja.</EmptyState.Description>
					<EmptyState.Action>
						<Button asChild>
							<Link href="/gerenciamento/categorias">Ir para categorias</Link>
						</Button>
					</EmptyState.Action>
				</EmptyState.Root>
			) : (
				<ProductForm categories={categories.map(({ id, name }) => ({ id, name }))} />
			)}
		</>
	);
}
