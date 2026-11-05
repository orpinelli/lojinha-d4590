import { Pencil, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/actions";
import { EmptyState, PageHeader, ResourceList } from "@/components/admin/blocks";
import { CategoryDialog } from "@/components/admin/category-dialog";
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
					<PageHeader.Description>Cada categoria vira uma seção e um item do menu da loja.</PageHeader.Description>
				</PageHeader.Content>
				<PageHeader.Actions>
					<CategoryDialog
						trigger={
							<Button className="h-10">
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
					<EmptyState.Description>Crie categorias como Vestuário, Acessórios e Combos.</EmptyState.Description>
				</EmptyState.Root>
			) : (
				<ResourceList.Root>
					{categories.map((category) => (
						<ResourceList.Item key={category.id}>
							<ResourceList.Content>
								<ResourceList.Title>{category.name}</ResourceList.Title>
								<ResourceList.Meta>
									<span>
										{category.productCount} produto{category.productCount === 1 ? "" : "s"}
									</span>
									<span>Ordem {category.position}</span>
								</ResourceList.Meta>
							</ResourceList.Content>
							<ResourceList.Actions>
								<CategoryDialog
									category={{ id: category.id, name: category.name, position: category.position }}
									trigger={
										<Button variant="outline" className="h-10 hover:bg-muted hover:text-foreground">
											<Pencil /> Editar
										</Button>
									}
								/>
								<DeleteButton resource="category" id={category.id} name={category.name} />
							</ResourceList.Actions>
						</ResourceList.Item>
					))}
				</ResourceList.Root>
			)}
		</>
	);
}
