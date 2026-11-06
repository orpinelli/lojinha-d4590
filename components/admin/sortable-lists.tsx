"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sortable, SortableHandle, SortableItem } from "@/components/ui/sortable";
import { DeleteButton } from "@/components/admin/actions";
import { ResourceList } from "@/components/admin/blocks";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { useReorder } from "@/hooks/use-reorder";
import { adminApi } from "@/lib/api-client";
import type { CategoryWithCount } from "@/modules/catalog/application/catalog-service";
import type { ShowcaseSummary } from "@/modules/showcase/application/showcase-service";
import { SHOWCASE_LAYOUT_LABELS } from "@/modules/showcase/domain/showcase";


function Position({ index }: { index: number }) {
	return (
		<span
			aria-hidden
			className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-extrabold text-label tabular-nums"
		>
			{index + 1}
		</span>
	);
}

/** Home page order: drag a showcase to move it up or down (saved immediately). */
export function ShowcaseList({
	showcases,
	categories,
}: {
	showcases: ShowcaseSummary[];
	categories: { id: string; name: string }[];
}) {
	const { items, reorder } = useReorder(showcases, adminApi.reorderShowcases);
	const categoryName = new Map(categories.map((category) => [category.id, category.name]));

	return (
		<Sortable
			ids={items.map((showcase) => showcase.id)}
			onReorder={reorder}
			getLabel={(id) => items.find((showcase) => showcase.id === id)?.title ?? ""}
		>
			<ResourceList.Root>
				{items.map((showcase, index) => {
					const editPath = `/gerenciamento/vitrines/${encodeURIComponent(showcase.id)}`;
					const source =
						showcase.source === "categories"
							? showcase.categoryIds.map((id) => categoryName.get(id)).filter(Boolean).join(" + ") ||
								"Sem categorias"
							: "Produtos escolhidos";
					return (
						<SortableItem key={showcase.id} id={showcase.id} asChild>
							<ResourceList.Item>
								<SortableHandle label={`Mover vitrine ${showcase.title}`} />
								<Position index={index} />
								<ResourceList.Content>
									<ResourceList.Title>
										<Link href={editPath} className="hover:underline">
											{showcase.title}
										</Link>
									</ResourceList.Title>
									<ResourceList.Meta>
										<Badge variant="outline">{SHOWCASE_LAYOUT_LABELS[showcase.layout]}</Badge>
										<span className="min-w-0 break-words">{source}</span>
										<span>
											{showcase.productCount} produto{showcase.productCount === 1 ? "" : "s"} na loja
										</span>
										{!showcase.active && <Badge variant="secondary">Oculta</Badge>}
									</ResourceList.Meta>
								</ResourceList.Content>
								<ResourceList.Actions>
									<Button asChild variant="outline" size="sm">
										<Link href={editPath}>
											<Pencil /> Editar
										</Link>
									</Button>
									<DeleteButton resource="showcase" id={showcase.id} name={showcase.title} />
								</ResourceList.Actions>
							</ResourceList.Item>
						</SortableItem>
					);
				})}
			</ResourceList.Root>
		</Sortable>
	);
}

/** Category order (used by lists and as the default order in showcases). */
export function CategoryList({ categories }: { categories: CategoryWithCount[] }) {
	const { items, reorder } = useReorder(categories, adminApi.reorderCategories);

	return (
		<Sortable
			ids={items.map((category) => category.id)}
			onReorder={reorder}
			getLabel={(id) => items.find((category) => category.id === id)?.name ?? ""}
		>
			<ResourceList.Root>
				{items.map((category, index) => (
					<SortableItem key={category.id} id={category.id} asChild>
						<ResourceList.Item>
							<SortableHandle label={`Mover categoria ${category.name}`} />
							<Position index={index} />
							<ResourceList.Content>
								<ResourceList.Title>{category.name}</ResourceList.Title>
								<ResourceList.Meta>
									<span>
										{category.productCount} produto{category.productCount === 1 ? "" : "s"}
									</span>
								</ResourceList.Meta>
							</ResourceList.Content>
							<ResourceList.Actions>
								<CategoryDialog
									category={{ id: category.id, name: category.name }}
									trigger={
										<Button variant="outline" size="sm">
											<Pencil /> Editar
										</Button>
									}
								/>
								<DeleteButton resource="category" id={category.id} name={category.name} />
							</ResourceList.Actions>
						</ResourceList.Item>
					</SortableItem>
				))}
			</ResourceList.Root>
		</Sortable>
	);
}
