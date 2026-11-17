"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ToggleChip } from "@/components/admin/form-fields/collection-fields";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
	ORDER_STATUSES,
	ORDER_STATUS_LABELS,
	PAYMENT_METHODS,
	PAYMENT_METHOD_LABELS,
	type OrderPatch,
	type OrderPaymentMethod,
	type OrderStatus,
	type PaymentMethod,
} from "@/modules/orders/domain/order";

/** Chips where one tap saves right away. */
function QuickChoice<V extends string>({
	label,
	value,
	options,
	labels,
	onChoose,
	className,
}: {
	label: string;
	/** null = none chosen yet. */
	value: V | null;
	options: readonly V[];
	labels: Record<V, string>;
	onChoose: (next: V) => Promise<unknown>;
	className?: string;
}) {
	const [pending, setPending] = useState<V | null>(null);

	const choose = async (next: V) => {
		if (next === value || pending) return;
		setPending(next);
		await onChoose(next);
		setPending(null);
	};

	return (
		<div role="group" aria-label={label} className={cn("grid grid-cols-2 gap-2 pb-1", className)}>
			{options.map((option) => (
				<ToggleChip
					key={option}
					pressed={option === value}
					disabled={pending !== null}
					onClick={() => choose(option)}
					className="inline-flex items-center justify-center gap-2 px-2 text-[13px] leading-tight disabled:opacity-60"
				>
					{pending === option && <Loader2 className="size-4 shrink-0 animate-spin" />}
					{labels[option]}
				</ToggleChip>
			))}
		</div>
	);
}

function useOrderPatch(orderId: string) {
	const mutate = useAdminMutation();
	return (changes: OrderPatch, successMessage: string) =>
		mutate(() => adminApi.patchOrder(orderId, changes), { successMessage });
}

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
	const patch = useOrderPatch(orderId);
	return (
		<QuickChoice
			label="Status do pedido"
			value={status}
			options={ORDER_STATUSES}
			labels={ORDER_STATUS_LABELS}
			onChoose={(next) => patch({ status: next }, `Status alterado para ${ORDER_STATUS_LABELS[next]}.`)}
		/>
	);
}

const PAID_OPTIONS = ["unpaid", "paid"] as const;
const PAID_LABELS: Record<(typeof PAID_OPTIONS)[number], string> = { unpaid: "Não pago", paid: "Pago" };

/** Paid or not (marked when the money arrives). */
export function OrderPaidControl({ orderId, paid }: { orderId: string; paid: boolean }) {
	const patch = useOrderPatch(orderId);
	return (
		<QuickChoice
			label="Situação do pagamento"
			value={paid ? "paid" : "unpaid"}
			options={PAID_OPTIONS}
			labels={PAID_LABELS}
			onChoose={(next) =>
				patch(
					{ paid: next === "paid" },
					next === "paid" ? "Pedido marcado como pago." : "Pedido marcado como não pago.",
				)
			}
		/>
	);
}

/** Pix, credit or debit card: chosen by the customer in the cart, changeable here. */
export function OrderPaymentMethodControl({
	orderId,
	paymentMethod,
}: {
	orderId: string;
	paymentMethod: OrderPaymentMethod;
}) {
	const patch = useOrderPatch(orderId);
	return (
		<QuickChoice<PaymentMethod>
			label="Forma de pagamento"
			value={paymentMethod || null}
			options={PAYMENT_METHODS}
			labels={PAYMENT_METHOD_LABELS}
			onChoose={(next) => patch({ paymentMethod: next }, `Forma de pagamento: ${PAYMENT_METHOD_LABELS[next]}.`)}
			className="grid-cols-1"
		/>
	);
}
