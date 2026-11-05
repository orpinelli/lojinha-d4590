import { z } from "zod";
import { assetUrlSchema } from "@/modules/shared/domain/validation";

export const MAX_PRODUCT_IMAGES = 12;
export const MAX_PRICE_IN_CENTS = 10_000_000;

/** Order is not part of the input: it is defined by drag and drop (reorder). */
export const categoryInputSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Informe o nome da categoria.")
		.max(60, "Use no máximo 60 caracteres."),
});

export const productDetailsSchema = z.object({
	title: z.string().trim().max(80, "Use no máximo 80 caracteres."),
	items: z
		.array(
			z
				.string()
				.trim()
				.min(1, "Preencha ou remova este item.")
				.max(160, "Use no máximo 160 caracteres."),
		)
		.max(30, "Use no máximo 30 itens."),
});

export const productInputSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Informe o nome do produto.")
		.max(120, "Use no máximo 120 caracteres."),
	description: z.string().trim().max(1000, "Use no máximo 1000 caracteres."),
	priceInCents: z
		.number({ error: "Informe o preço." })
		.int("Preço inválido.")
		.min(0, "O preço não pode ser negativo.")
		.max(MAX_PRICE_IN_CENTS, "Preço acima do permitido."),
	categoryId: z.string().trim().min(1, "Selecione a categoria."),
	images: z
		.array(assetUrlSchema)
		.min(1, "Adicione pelo menos uma imagem.")
		.max(MAX_PRODUCT_IMAGES, `Use no máximo ${MAX_PRODUCT_IMAGES} imagens.`),
	sizes: z
		.array(z.string().trim().min(1).max(10, "Tamanho muito longo."))
		.max(20, "Use no máximo 20 tamanhos.")
		.refine((sizes) => new Set(sizes).size === sizes.length, "Há tamanhos repetidos."),
	details: productDetailsSchema,
	active: z.boolean(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type ProductDetails = z.infer<typeof productDetailsSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;

/** Persisted entities: `position` is the default order (creation order or drag and drop). */
type Persisted = { id: string; position: number; createdAt: string; updatedAt: string };

export type Category = CategoryInput & Persisted;
export type Product = ProductInput & Persisted;
