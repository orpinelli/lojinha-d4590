import Link from "next/link";
import { GalleryHorizontalEnd, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/admin/blocks";
import { ShowcaseList } from "@/components/admin/sortable-lists";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";

export default async function ShowcasesPage() {
	await requireAdminSession();
	const { showcases, catalog } = await getRequestServices();
	const [list, categories] = await Promise.all([
		showcases.listWithCounts(),
		catalog.listCategories(),
	]);

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Vitrines</PageHeader.Title>
					<PageHeader.Description>
						As seções da página inicial, uma embaixo da outra. Arraste pela alça ⠿ para mudar a ordem.
					</PageHeader.Description>
				</PageHeader.Content>
				<PageHeader.Actions>
					<Button asChild className="h-10">
						<Link href="/gerenciamento/vitrines/nova">
							<Plus /> Nova vitrine
						</Link>
					</Button>
				</PageHeader.Actions>
			</PageHeader.Root>

			{list.length === 0 ? (
				<EmptyState.Root>
					<EmptyState.Icon>
						<GalleryHorizontalEnd />
					</EmptyState.Icon>
					<EmptyState.Title>Nenhuma vitrine</EmptyState.Title>
					<EmptyState.Description>
						Sem vitrines, a página inicial mostra só o topo. Crie a primeira para exibir produtos.
					</EmptyState.Description>
				</EmptyState.Root>
			) : (
				<ShowcaseList
					showcases={list}
					categories={categories.map(({ id, name }) => ({ id, name }))}
				/>
			)}
		</>
	);
}
