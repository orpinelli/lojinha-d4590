import { z } from "zod";

export const SHOWCASE_LAYOUTS = ["carousel", "grid", "featured"] as const;
export const SHOWCASE_SOURCES = ["categories", "products"] as const;

const idList = (max: number) =>
	z
		.array(z.string().trim().min(1))
		.max(max, `Use no máximo ${max} itens.`)
		.refine((ids) => new Set(ids).size === ids.length, "Há itens repetidos.");

/**
 * A showcase ("vitrine") is one section of the home page.
 * - source "products": exactly `productIds`, in that order.
 * - source "categories": every active product of `categoryIds`; `productIds`
 *   only defines the order (drag and drop) and `excludedProductIds` hides some.
 */
export const showcaseInputSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(1, "Informe o título da vitrine.")
			.max(60, "Use no máximo 60 caracteres."),
		layout: z.enum(SHOWCASE_LAYOUTS, { error: "Escolha o formato." }),
		source: z.enum(SHOWCASE_SOURCES, { error: "Escolha o conteúdo." }),
		categoryIds: idList(20),
		productIds: idList(200),
		excludedProductIds: idList(200),
		active: z.boolean(),
	})
	.superRefine((value, context) => {
		if (value.source === "categories" && value.categoryIds.length === 0) {
			context.addIssue({
				code: "custom",
				path: ["categoryIds"],
				message: "Escolha pelo menos uma categoria.",
			});
		}
		if (value.source === "products" && value.productIds.length === 0) {
			context.addIssue({
				code: "custom",
				path: ["productIds"],
				message: "Escolha pelo menos um produto.",
			});
		}
	});

export type ShowcaseInput = z.infer<typeof showcaseInputSchema>;
export type ShowcaseLayout = ShowcaseInput["layout"];
export type ShowcaseSource = ShowcaseInput["source"];
export type Showcase = ShowcaseInput & {
	id: string;
	position: number;
	createdAt: string;
	updatedAt: string;
};
