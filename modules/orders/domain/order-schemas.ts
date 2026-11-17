import { z } from "zod";
import { MAX_SIZE_LENGTH } from "@/modules/catalog/domain/product";
import { optionalPhoneSchema } from "@/modules/shared/domain/validation";
import { ORDER_STATUSES, PAYMENT_METHODS, isOrderCode } from "./order";

const customerNameSchema = z.string().trim().max(120, "Use no máximo 120 caracteres.");
const customerClubSchema = z.string().trim().max(120, "Use no máximo 120 caracteres.");
const customerDistrictSchema = z.string().trim().max(60, "Use no máximo 60 caracteres.");
const sizeSchema = z.string().trim().max(MAX_SIZE_LENGTH, `Use no máximo ${MAX_SIZE_LENGTH} caracteres.`);
const paymentMethodSchema = z.enum(PAYMENT_METHODS, { error: "Escolha a forma de pagamento." });

/**
 * Public: what the cart sends when the visitor finishes. Only ids, sizes and
 * quantities — names and prices always come from the catalog on the server.
 * The payment method is required; name, club, district and phone are optional.
 */
export const checkoutInputSchema = z.object({
	code: z.string().refine(isOrderCode, "Código do pedido inválido."),
	paymentMethod: paymentMethodSchema,
	customerName: customerNameSchema.default(""),
	customerClub: customerClubSchema.default(""),
	customerDistrict: customerDistrictSchema.default(""),
	customerPhone: optionalPhoneSchema.default(""),
	items: z
		.array(
			z.object({
				productId: z.string().trim().min(1).max(100),
				size: sizeSchema.default(""),
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
	size: sizeSchema,
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

const statusSchema = z.enum(ORDER_STATUSES, { error: "Escolha o status." });
const paidSchema = z.boolean({ error: "Informe se o pedido foi pago." });

/** Admin edit: everything except the code and the dates. The total is recalculated. */
export const orderDetailsSchema = z.object({
	status: statusSchema,
	paid: paidSchema,
	/** "" keeps "not informed" on orders made before the cart asked for it. */
	paymentMethod: paymentMethodSchema.or(z.literal("")),
	customerName: customerNameSchema,
	customerClub: customerClubSchema,
	customerDistrict: customerDistrictSchema,
	customerPhone: optionalPhoneSchema,
	notes: z.string().trim().max(1000, "Use no máximo 1000 caracteres."),
	items: z
		.array(orderItemSchema)
		.min(1, "O pedido precisa ter pelo menos 1 item.")
		.max(100, "Itens demais."),
});

/** Quick change from the order page: any of `{ status, paid, paymentMethod }`, never none. */
export const orderPatchSchema = z
	.object({
		status: statusSchema.optional(),
		paid: paidSchema.optional(),
		paymentMethod: paymentMethodSchema.optional(),
	})
	.refine((patch) => Object.values(patch).some((value) => value !== undefined), "Nada para alterar.");

export type CheckoutInput = z.input<typeof checkoutInputSchema>;
export type OrderDetailsInput = z.input<typeof orderDetailsSchema>;
export type OrderPatchInput = z.input<typeof orderPatchSchema>;
