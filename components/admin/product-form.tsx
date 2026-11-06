"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GalleryHorizontalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { FormSubmitButton } from "@/components/admin/actions";
import { FormActions, FormSection } from "@/components/admin/blocks";
import { Field } from "@/components/admin/form-fields";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { applyServerErrors } from "@/lib/form-errors";
import {
	MAX_PRODUCT_IMAGES,
	productInputSchema,
} from "@/modules/catalog/domain/catalog-schemas";
import type { Product, ProductInput } from "@/modules/catalog/domain/product";

const PRODUCTS_PATH = "/gerenciamento/produtos";

function toFormValues(product: Product | undefined, defaultCategoryId: string): ProductInput {
	if (!product) {
		return {
			name: "",
			description: "",
			priceInCents: 0,
			categoryId: defaultCategoryId,
			images: [],
			sizes: [],
			details: { title: "Descrição do Produto", items: [] },
			active: true,
		};
	}
	const {
		id: _id,
		position: _position,
		createdAt: _created,
		updatedAt: _updated,
		...input
	} = product;
	return input;
}

export function ProductForm({
	product,
	categories,
	showcaseTitles,
}: {
	product?: Product;
	categories: { id: string; name: string }[];
	/** Visible showcases where the product appears (edit mode). */
	showcaseTitles?: string[];
}) {
	const router = useRouter();
	const mutate = useAdminMutation();
	const { showToast } = useToast();
	const form = useForm<ProductInput>({
		resolver: zodResolver(productInputSchema),
		defaultValues: toFormValues(product, categories[0]?.id ?? ""),
		mode: "onTouched",
	});

	const onSubmit = form.handleSubmit(
		async (values) => {
			await mutate(
				() => (product ? adminApi.updateProduct(product.id, values) : adminApi.createProduct(values)),
				{
					successMessage: product ? "Produto atualizado." : "Produto cadastrado.",
					onSuccess: () => {
						form.reset(values);
						router.push(PRODUCTS_PATH);
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
					<FormSection.Header title="Informações" description="Nome, categoria, preço e descrição." />
					<FormSection.Content>
						<Field.Text name="name" label="Nome do produto" placeholder="Ex.: Camiseta preta" maxLength={120} />
						<div className="grid gap-5 sm:grid-cols-2">
							<Field.Select
								name="categoryId"
								label="Categoria"
								options={categories.map((category) => ({ value: category.id, label: category.name }))}
							/>
							<Field.Money name="priceInCents" label="Preço" />
						</div>
						<Field.Textarea
							name="description"
							label="Descrição"
							rows={4}
							description="Aparece no destaque da página inicial e no Google."
						/>
					</FormSection.Content>
				</FormSection.Root>

				<FormSection.Root>
					<FormSection.Header
						title="Imagens"
						description={`A primeira imagem é a capa. Até ${MAX_PRODUCT_IMAGES} imagens de até 5 MB (JPG, PNG, WEBP, GIF ou AVIF).`}
					/>
					<FormSection.Content>
						<Field.ImageList name="images" label="Galeria" max={MAX_PRODUCT_IMAGES} />
					</FormSection.Content>
				</FormSection.Root>

				<FormSection.Root>
					<FormSection.Header
						title="Tamanhos"
						description="Deixe todos desmarcados se o produto não tiver tamanho (ex.: caneca)."
					/>
					<FormSection.Content>
						<Field.Sizes name="sizes" label="Tamanhos disponíveis" />
					</FormSection.Content>
				</FormSection.Root>

				<FormSection.Root>
					<FormSection.Header title="Detalhes" description="Lista exibida na página do produto." />
					<FormSection.Content>
						<Field.Text
							name="details.title"
							label="Título da lista"
							placeholder="Ex.: Descrição do Produto ou O Kit Inclui"
							maxLength={80}
						/>
						<Field.StringList
							name="details.items"
							label="Itens"
							placeholder="Ex.: Tecido: 100% algodão"
						/>
					</FormSection.Content>
				</FormSection.Root>

				<FormSection.Root>
					<FormSection.Header title="Visibilidade" />
					<FormSection.Content>
						<Field.Switch
							name="active"
							label="Visível na loja"
							description="Desligue para esconder o produto sem excluir."
						/>
						<p className="flex gap-2 rounded-xl bg-muted p-3 text-sm font-semibold text-muted-foreground">
							<GalleryHorizontalEnd className="mt-0.5 size-4 shrink-0" aria-hidden />
							<span>
								{showcaseTitles === undefined
									? "Depois de salvar, ele entra sozinho nas vitrines montadas pela categoria dele."
									: showcaseTitles.length > 0
										? `Aparece nas vitrines: ${showcaseTitles.join(", ")}.`
										: "Ainda não está em nenhuma vitrine visível."}{" "}
								<Link href="/gerenciamento/vitrines" className="font-extrabold text-link underline-offset-4 hover:underline">
									Gerenciar vitrines
								</Link>
							</span>
						</p>
					</FormSection.Content>
				</FormSection.Root>

				<FormActions>
					<Button asChild variant="outline">
						<Link href={PRODUCTS_PATH}>Cancelar</Link>
					</Button>
					<FormSubmitButton>{product ? "Salvar alterações" : "Cadastrar produto"}</FormSubmitButton>
				</FormActions>
			</form>
		</Form>
	);
}
