import { z } from "zod";
import { isValidWhatsapp, normalizeWhatsapp } from "@/modules/shared/domain/phone";
import { ORDER_STATUSES, isOrderCode } from "./order";

/**
 * Public: what the cart sends when the visitor finishes. Only ids, sizes and
 * quantities — names and prices always come from the catalog on the server.
 */
export const checkoutInputSchema = z.object({
	code: z.string().refine(isOrderCode, "Código do pedido inválido."),
	items: z
		.array(
			z.object({
				productId: z.string().trim().min(1).max(100),
				size: z.string().trim().max(20).default(""),
				quantity: z.number().int().min(1).max(99),
			}),
		)
		.min(1, "O carrinho está vazio.")
		.max(50, "Itens demais no carrinho."),
});

export const orderItemSchema = z.object({
	productId: z.string().trim().max(100),
	name: z
		.string()
		.trim()
		.min(1, "Informe o nome do produto.")
		.max(120, "Use no máximo 120 caracteres."),
	size: z.string().trim().max(20, "Use no máximo 20 caracteres."),
	quantity: z
		.number({ error: "Informe a quantidade." })
		.int("Use um número inteiro.")
		.min(1, "Mínimo 1.")
		.max(999, "Máximo 999."),
	unitPriceInCents: z
		.number({ error: "Informe o preço." })
		.int()
		.min(0, "O preço não pode ser negativo.")
		.max(10_000_000, "Preço alto demais."),
});

/** Admin edit: everything except the code and the dates. The total is recalculated. */
export const orderDetailsSchema = z.object({
	status: z.enum(ORDER_STATUSES, { error: "Escolha o status." }),
	customerName: z.string().trim().max(120, "Use no máximo 120 caracteres."),
	customerPhone: z
		.string()
		.transform(normalizeWhatsapp)
		.refine(
			(digits) => digits === "" || isValidWhatsapp(digits),
			"Telefone inválido. Confira o DDD e os dígitos.",
		),
	notes: z.string().trim().max(1000, "Use no máximo 1000 caracteres."),
	items: z
		.array(orderItemSchema)
		.min(1, "O pedido precisa ter pelo menos 1 item.")
		.max(100, "Itens demais."),
});

export const orderStatusInputSchema = z.object({
	status: z.enum(ORDER_STATUSES, { error: "Escolha o status." }),
});

export type CheckoutInput = z.input<typeof checkoutInputSchema>;
export type OrderDetailsInput = z.input<typeof orderDetailsSchema>;
