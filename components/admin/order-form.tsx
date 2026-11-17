"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, CircleX, Clock, Plus, Trash2, Truck } from "lucide-react";
import { Price } from "@/components/store/price";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { FormSubmitButton } from "@/components/admin/actions";
import { FormActions, FormSection } from "@/components/admin/blocks";
import { Field } from "@/components/admin/form-fields";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { applyServerErrors } from "@/lib/form-errors";
import { formatPrice } from "@/modules/shared/domain/money";
import { MAX_SIZE_LENGTH } from "@/modules/catalog/domain/product";
import {
	PAYMENT_METHODS,
	PAYMENT_METHOD_LABELS,
	orderTotal,
	type Order,
} from "@/modules/orders/domain/order";
import { orderDetailsSchema, type OrderDetailsInput } from "@/modules/orders/domain/order-schemas";

export type OrderProductOption = { id: string; name: string; priceInCents: number; active: boolean };

const STATUS_OPTIONS = [
	{ value: "new", label: "Novo", description: "Chegou pelo site. Confira a conversa no WhatsApp.", icon: <Clock /> },
	{ value: "confirmed", label: "Confirmado", description: "Pagamento e entrega combinados.", icon: <CircleCheck /> },
	{ value: "delivered", label: "Entregue", description: "O cliente já recebeu.", icon: <Truck /> },
	{ value: "canceled", label: "Cancelado", description: "O pedido não vai seguir.", icon: <CircleX /> },
];

const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

const amount = (value: unknown) => (Number.isFinite(value) ? Number(value) : 0);

function LineSubtotal({ index }: { index: number }) {
	const [quantity, price] = useWatch({ name: [`items.${index}.quantity`, `items.${index}.unitPriceInCents`] });
	return (
		<p className="text-right text-sm font-semibold text-muted-foreground">
			Subtotal <Price cents={amount(quantity) * amount(price)} className="font-extrabold" />
		</p>
	);
}

/** Picking a product adds a line with its current name and price. */
function AddProductSelect({
	products,
	onAdd,
}: {
	products: OrderProductOption[];
	onAdd: (product: OrderProductOption) => void;
}) {
	// Remounting resets the select to its placeholder after each pick.
	const [round, setRound] = useState(0);
	return (
		<Select
			key={round}
			onValueChange={(id) => {
				const product = products.find((item) => item.id === id);
				if (product) onAdd(product);
				setRound((current) => current + 1);
			}}
		>
			<SelectTrigger className="w-full" aria-label="Adicionar produto ao pedido">
				{/* div, not span: the trigger clamps direct <span> children to one line */}
				<div className="flex min-w-0 items-center gap-2">
					<Plus className="size-4 shrink-0 text-primary" strokeWidth={3} />
					<SelectValue placeholder="Adicionar produto ao pedido" />
				</div>
			</SelectTrigger>
			<SelectContent>
				{products.map((product) => (
					<SelectItem key={product.id} value={product.id}>
						{product.name} · {formatPrice(product.priceInCents)}
						{!product.active && " (oculto)"}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function OrderItemsEditor({ products }: { products: OrderProductOption[] }) {
	const { control } = useFormContext<OrderDetailsInput>();
	const { fields, append, remove } = useFieldArray({ control, name: "items" });
	const items = useWatch({ control, name: "items" }) ?? [];
	const total = orderTotal(
		items.map((item) => ({ quantity: amount(item?.quantity), unitPriceInCents: amount(item?.unitPriceInCents) })),
	);

	return (
		<div className="space-y-4">
			{fields.map((field, index) => (
				<div key={field.id} className="space-y-4 rounded-2xl border-2 p-3 sm:p-4">
					<div className="flex items-center justify-between gap-2">
						<span className="text-xs font-extrabold tracking-[1.5px] text-label uppercase">Item {index + 1}</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => remove(index)}
							disabled={fields.length === 1}
							aria-label={`Remover item ${index + 1}`}
							className="size-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 />
						</Button>
					</div>
					<Field.Text name={`items.${index}.name`} label="Produto" maxLength={120} />
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<Field.Text
							name={`items.${index}.size`}
							label="Tamanho"
							placeholder="Sem tamanho"
							maxLength={MAX_SIZE_LENGTH}
						/>
						<Field.Number name={`items.${index}.quantity`} label="Quantidade" />
						<Field.Money
							name={`items.${index}.unitPriceInCents`}
							label="Preço unitário"
							className="col-span-2 sm:col-span-1"
						/>
					</div>
					<LineSubtotal index={index} />
				</div>
			))}

			<AddProductSelect
				products={products}
				onAdd={(product) =>
					append({
						productId: product.id,
						name: product.name,
						size: "",
						quantity: 1,
						unitPriceInCents: product.priceInCents,
					})
				}
			/>

			<div className="flex items-baseline justify-between gap-3 rounded-2xl bg-muted px-4 py-3">
				<span className="text-sm font-extrabold tracking-[1px] text-label uppercase">Total</span>
				<Price cents={total} className="font-display text-2xl font-semibold" />
			</div>
		</div>
	);
}

export function OrderForm({
	order,
	products,
	cancelHref,
}: {
	order: Order;
	products: OrderProductOption[];
	cancelHref: string;
}) {
	const router = useRouter();
	const mutate = useAdminMutation();
	const { showToast } = useToast();
	const form = useForm<OrderDetailsInput>({
		resolver: zodResolver(orderDetailsSchema),
		defaultValues: {
			status: order.status,
			paid: order.paid,
			paymentMethod: order.paymentMethod,
			customerName: order.customerName,
			customerClub: order.customerClub,
			customerDistrict: order.customerDistrict,
			customerPhone: order.customerPhone,
			notes: order.notes,
			items: order.items,
		},
		mode: "onTouched",
	});

	const onSubmit = form.handleSubmit(
		async (values) => {
			await mutate(() => adminApi.updateOrder(order.id, values), {
				successMessage: "Pedido atualizado.",
				onSuccess: () => {
					form.reset(values);
					router.push(cancelHref);
				},
				onError: (error) => applyServerErrors(form, error),
			});
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
					<FormSection.Header title="Status e pagamento" />
					<FormSection.Content>
						<Field.Choice name="status" label="Situação do pedido" options={STATUS_OPTIONS} />
						<Field.Choice
							name="paymentMethod"
							label="Forma de pagamento"
							description="Escolhida pelo cliente no carrinho."
							options={PAYMENT_METHOD_OPTIONS}
						/>
						<Field.Switch name="paid" label="Pago" description="Ligue quando o pagamento chegar." />
					</FormSection.Content>
				</FormSection.Root>

				<FormSection.Root>
					<FormSection.Header title="Cliente" description="Opcional: ajuda a lembrar de quem é o pedido." />
					<FormSection.Content>
						<div className="grid gap-5 sm:grid-cols-2">
							<Field.Text name="customerName" label="Nome" placeholder="Ex.: Maria Silva" maxLength={120} />
							<Field.Text name="customerClub" label="Clube" placeholder="Nome do clube" maxLength={120} />
							<Field.Text name="customerDistrict" label="Distrito" placeholder="Ex.: 4590" maxLength={60} />
							<Field.Phone name="customerPhone" label="WhatsApp" />
						</div>
						<Field.Textarea
							name="notes"
							label="Observações"
							rows={3}
							placeholder="Ex.: retira no evento de sábado, pagou via Pix."
						/>
					</FormSection.Content>
				</FormSection.Root>

				<FormSection.Root>
					<FormSection.Header
						title="Itens"
						description="Mude tamanho, quantidade ou preço, remova itens ou adicione produtos. O total é recalculado."
					/>
					<FormSection.Content>
						<OrderItemsEditor products={products} />
					</FormSection.Content>
				</FormSection.Root>

				<FormActions>
					<Button asChild variant="outline">
						<Link href={cancelHref}>Cancelar</Link>
					</Button>
					<FormSubmitButton requireDirty>Salvar pedido</FormSubmitButton>
				</FormActions>
			</form>
		</Form>
	);
}
