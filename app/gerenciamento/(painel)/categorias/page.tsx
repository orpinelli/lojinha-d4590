import { Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/admin/blocks";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { CategoryList } from "@/components/admin/sortable-lists";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";

export default async function CategoriesPage() {
	await requireAdminSession();
	const { catalog } = await getRequestServices();
	const categories = await catalog.listCategories();

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Categorias</PageHeader.Title>
					<PageHeader.Description>
						Organize os produtos (Camisetas, Acessórios, Canecas…). Arraste pela alça ⠿ para ordenar.
					</PageHeader.Description>
				</PageHeader.Content>
				<PageHeader.Actions>
					<CategoryDialog
						trigger={
							<Button>
								<Plus /> Nova categoria
							</Button>
						}
					/>
				</PageHeader.Actions>
			</PageHeader.Root>

			{categories.length === 0 ? (
				<EmptyState.Root>
					<EmptyState.Icon>
						<Tags />
					</EmptyState.Icon>
					<EmptyState.Title>Nenhuma categoria</EmptyState.Title>
					<EmptyState.Description>Crie categorias como Camisetas, Acessórios e Combos.</EmptyState.Description>
				</EmptyState.Root>
			) : (
				<CategoryList categories={categories} />
			)}
		</>
	);
}
