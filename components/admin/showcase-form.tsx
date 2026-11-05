"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Eye,
	EyeOff,
	GalleryHorizontalEnd,
	LayoutGrid,
	Package,
	Search,
	Sparkles,
	Tags,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sortable, SortableHandle, SortableItem } from "@/components/ui/sortable";
import { useToast } from "@/components/ui/toast";
import { FormSubmitButton } from "@/components/admin/actions";
import { FormActions, FormSection, ResourceList } from "@/components/admin/blocks";
import { Field } from "@/components/admin/form-fields";
import type { ChoiceOption } from "@/components/admin/form-fields/basic-fields";
import { FieldFrame } from "@/components/admin/form-fields/field-frame";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { applyServerErrors } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { slugify } from "@/modules/shared/domain/text";
import {
	resolveShowcaseProducts,
	showcaseEditorRows,
	type Showcase,
	type ShowcaseCandidate,
	type ShowcaseInput,
} from "@/modules/showcase/domain/showcase";
import { showcaseInputSchema } from "@/modules/showcase/domain/showcase-schemas";

const SHOWCASES_PATH = "/gerenciamento/vitrines";

type Catalog = { products: ShowcaseCandidate[]; categories: { id: string; name: string }[] };

const LAYOUT_OPTIONS: ChoiceOption[] = [
	{
		value: "carousel",
		label: "Carrossel",
		description: "Desliza para os lados.",
		icon: <GalleryHorizontalEnd />,
	},
	{ value: "grid", label: "Grade", description: "Todos visíveis, em colunas.", icon: <LayoutGrid /> },
	{
		value: "featured",
		label: "Destaque",
		description: "Cards grandes; o título vira o selo dos cards.",
		icon: <Sparkles />,
	},
];

const SOURCE_OPTIONS: ChoiceOption[] = [
	{
		value: "categories",
		label: "Por categoria",
		description: "Junte uma ou mais categorias. Produtos novos entram sozinhos.",
		icon: <Tags />,
	},
	{
		value: "products",
		label: "Escolher produtos",
		description: "Você seleciona cada produto.",
		icon: <Package />,
	},
];

function toFormValues(showcase?: Showcase): ShowcaseInput {
	if (!showcase) {
		return {
			title: "",
			layout: "carousel",
			source: "categories",
			categoryIds: [],
			productIds: [],
			excludedProductIds: [],
			active: true,
		};
	}
	const { id: _id, position: _position, createdAt: _created, updatedAt: _updated, ...input } = showcase;
	return input;
}

function Thumb({ src }: { src: string }) {
	return (
		<span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
			{src && <Image src={src} alt="" fill sizes="48px" className="object-cover" />}
		</span>
	);
}

export function ShowcaseForm({ showcase, products, categories }: Catalog & { showcase?: Showcase }) {
	const router = useRouter();
	const mutate = useAdminMutation();
	const { showToast } = useToast();
	const form = useForm<ShowcaseInput>({
		resolver: zodResolver(showcaseInputSchema),
		defaultValues: toFormValues(showcase),
		mode: "onTouched",
	});

	/** Switching to manual selection starts with what the categories showed. */
	const handleSourceChange = (source: string) => {
		const values = form.getValues();
		if (source === "products") {
			const visible = resolveShowcaseProducts({ ...values, source: "categories" }, products);
			form.setValue(
				"productIds",
				visible.map((product) => product.id),
				{ shouldDirty: true },
			);
		}
		form.setValue("excludedProductIds", [], { shouldDirty: true });
		form.clearErrors(["productIds", "categoryIds"]);
	};

	const onSubmit = form.handleSubmit(
		async (values) => {
			await mutate(
				() => (showcase ? adminApi.updateShowcase(showcase.id, values) : adminApi.createShowcase(values)),
				{
					successMessage: showcase ? "Vitrine atualizada." : "Vitrine criada.",
					onSuccess: () => {
						form.reset(values);
						router.push(SHOWCASES_PATH);
					},
					onError: (error) => applyServerErrors(form, error),
				},
			);
		},
		() =>
			showToast({
				type: "warning",
				title: "Confira o formulário",
				message: "Há campos com erro destacados em vermelho.",
				duration: 4000,
			}),
	);

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} noValidate className="space-y-6">
				<FormSection.Root>
					<FormSection.Header title="Vitrine" description="Título e formato na página inicial." />
					<FormSection.Content>
						<Field.Text name="title" label="Título" placeholder="Ex.: Lançamentos" maxLength={60} />
						<Field.Choice name="layout" label="Formato" options={LAYOUT_OPTIONS} />
						<Field.Switch
							name="active"
							label="Visível na loja"
							description="Desligue para esconder a vitrine sem excluir."
						/>
					</FormSection.Content>
				</FormSection.Root>

				<FormSection.Root>
					<FormSection.Header title="Conteúdo" description="Quais produtos entram nesta vitrine." />
					<FormSection.Content>
						<Field.Choice
							name="source"
							label="Montar por"
							options={SOURCE_OPTIONS}
							onValueChange={handleSourceChange}
						/>
						<SourcePicker products={products} categories={categories} />
					</FormSection.Content>
				</FormSection.Root>

				<FormSection.Root>
					<FormSection.Header
						title="Ordem e visibilidade"
						description="Arraste pela alça ⠿ para definir a ordem dos produtos nesta vitrine."
					/>
					<FormSection.Content>
						<ProductOrder products={products} categories={categories} />
					</FormSection.Content>
				</FormSection.Root>

				<FormActions>
					<Button asChild variant="outline" className="h-10 hover:bg-muted hover:text-foreground">
						<Link href={SHOWCASES_PATH}>Cancelar</Link>
					</Button>
					<FormSubmitButton>{showcase ? "Salvar vitrine" : "Criar vitrine"}</FormSubmitButton>
				</FormActions>
			</form>
		</Form>
	);
}

function SourcePicker({ products, categories }: Catalog) {
	const source = useWatch<ShowcaseInput, "source">({ name: "source" });
	if (source === "categories") {
		return (
			<Field.Chips
				name="categoryIds"
				label="Categorias"
				description="Escolha uma ou mais: os produtos delas aparecem juntos."
				options={categories.map((category) => ({ value: category.id, label: category.name }))}
				emptyMessage="Nenhuma categoria cadastrada ainda."
			/>
		);
	}
	return <ProductPicker products={products} categories={categories} />;
}

function ProductPicker({ products, categories }: Catalog) {
	const { control } = useFormContext<ShowcaseInput>();
	const [query, setQuery] = useState("");
	const categoryName = new Map(categories.map((category) => [category.id, category.name]));
	const term = slugify(query);
	const visible = products.filter(
		(product) =>
			!term ||
			slugify(product.name).includes(term) ||
			slugify(categoryName.get(product.categoryId) ?? "").includes(term),
	);

	return (
		<FormField
			control={control}
			name="productIds"
			render={({ field }) => {
				const selected: string[] = field.value ?? [];
				const toggle = (id: string) =>
					field.onChange(
						selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id],
					);
				return (
					<FieldFrame
						label="Produtos"
						description={`${selected.length} selecionado(s). A ordem é definida abaixo.`}
						asControl={false}
					>
						<div className="space-y-2">
							<div className="relative">
								<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Buscar produto ou categoria"
									aria-label="Buscar produto"
									className="pl-9"
								/>
							</div>
							<FormControl>
								<ul className="max-h-80 divide-y overflow-y-auto overscroll-contain rounded-md border">
									{visible.map((product) => (
										<li key={product.id}>
											<label className="flex cursor-pointer items-center gap-3 p-2.5 hover:bg-muted/60">
												<input
													type="checkbox"
													checked={selected.includes(product.id)}
													onChange={() => toggle(product.id)}
													className="size-4 shrink-0 accent-primary"
												/>
												<Thumb src={product.image} />
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium">{product.name}</span>
													<span className="block truncate text-xs text-muted-foreground">
														{categoryName.get(product.categoryId) ?? "Sem categoria"}
														{!product.active && " · oculto na loja"}
													</span>
												</span>
											</label>
										</li>
									))}
									{visible.length === 0 && (
										<li className="p-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</li>
									)}
								</ul>
							</FormControl>
						</div>
					</FieldFrame>
				);
			}}
		/>
	);
}

/** Live preview of the showcase: drag to order, eye to hide (category mode). */
function ProductOrder({ products, categories }: Catalog) {
	const { control, setValue } = useFormContext<ShowcaseInput>();
	const [source, categoryIds, productIds, excludedProductIds] = useWatch({
		control,
		name: ["source", "categoryIds", "productIds", "excludedProductIds"],
	});
	const rows = showcaseEditorRows({ source, categoryIds, productIds, excludedProductIds }, products);
	const categoryName = new Map(categories.map((category) => [category.id, category.name]));

	if (rows.length === 0) {
		return (
			<p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
				{source === "categories"
					? "Escolha categorias acima para ver os produtos desta vitrine."
					: "Selecione produtos acima para montar a vitrine."}
			</p>
		);
	}

	const ids = rows.map(({ product }) => product.id);
	const nameOf = (id: string) => rows.find(({ product }) => product.id === id)?.product.name ?? "";
	const toggleHidden = (id: string) =>
		setValue(
			"excludedProductIds",
			excludedProductIds.includes(id)
				? excludedProductIds.filter((item) => item !== id)
				: [...excludedProductIds, id],
			{ shouldDirty: true },
		);
	const remove = (id: string) =>
		setValue(
			"productIds",
			productIds.filter((item) => item !== id),
			{ shouldDirty: true, shouldValidate: true },
		);

	return (
		<Sortable
			ids={ids}
			getLabel={nameOf}
			onReorder={(next) => setValue("productIds", next, { shouldDirty: true })}
		>
			<ResourceList.Root>
				{rows.map(({ product, hidden }, index) => (
					<SortableItem key={product.id} id={product.id} asChild>
						<ResourceList.Item className="flex-nowrap gap-2 p-2 sm:gap-3 sm:p-3">
							<SortableHandle label={`Mover ${product.name}`} />
							<span
								aria-hidden
								className="hidden w-5 shrink-0 text-center text-sm text-muted-foreground tabular-nums min-[420px]:block"
							>
								{index + 1}
							</span>
							<Thumb src={product.image} />
							<ResourceList.Content className={cn(hidden && "opacity-50")}>
								<ResourceList.Title className="text-sm">{product.name}</ResourceList.Title>
								<ResourceList.Meta className="text-xs">
									<span>{categoryName.get(product.categoryId) ?? "Sem categoria"}</span>
									{hidden && <Badge variant="outline">Oculto nesta vitrine</Badge>}
									{!product.active && <Badge variant="outline">Inativo</Badge>}
								</ResourceList.Meta>
							</ResourceList.Content>
							{source === "categories" ? (
								<Button
									type="button"
									variant="ghost"
									onClick={() => toggleHidden(product.id)}
									aria-pressed={hidden}
									aria-label={hidden ? `Mostrar ${product.name} nesta vitrine` : `Ocultar ${product.name} desta vitrine`}
									title={hidden ? "Mostrar nesta vitrine" : "Ocultar desta vitrine"}
									className="size-10 shrink-0 p-0 hover:bg-muted hover:text-foreground"
								>
									{hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
								</Button>
							) : (
								<Button
									type="button"
									variant="ghost"
									onClick={() => remove(product.id)}
									aria-label={`Remover ${product.name} da vitrine`}
									className="size-10 shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
								>
									<X className="size-4" />
								</Button>
							)}
						</ResourceList.Item>
					</SortableItem>
				))}
			</ResourceList.Root>
		</Sortable>
	);
}
