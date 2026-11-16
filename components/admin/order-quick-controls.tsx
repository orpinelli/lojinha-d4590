"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ToggleChip } from "@/components/admin/form-fields/collection-fields";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import {
	ORDER_PAYMENTS,
	ORDER_PAYMENT_LABELS,
	ORDER_STATUSES,
	ORDER_STATUS_LABELS,
	isPaid,
	type OrderPatch,
	type OrderPayment,
	type OrderStatus,
} from "@/modules/orders/domain/order";

/** Chips where one tap saves right away. */
function QuickChoice<V extends string>({
	label,
	value,
	options,
	labels,
	onChoose,
}: {
	label: string;
	value: V;
	options: readonly V[];
	labels: Record<V, string>;
	onChoose: (next: V) => Promise<unknown>;
}) {
	const [pending, setPending] = useState<V | null>(null);

	const choose = async (next: V) => {
		if (next === value || pending) return;
		setPending(next);
		await onChoose(next);
		setPending(null);
	};

	return (
		<div role="group" aria-label={label} className="grid grid-cols-2 gap-2 pb-1">
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

/** "Não pago" or the method used: choosing a method marks the order as paid. */
export function OrderPaymentControl({ orderId, payment }: { orderId: string; payment: OrderPayment }) {
	const patch = useOrderPatch(orderId);
	return (
		<QuickChoice
			label="Pagamento do pedido"
			value={payment}
			options={ORDER_PAYMENTS}
			labels={ORDER_PAYMENT_LABELS}
			onChoose={(next) =>
				patch(
					{ payment: next },
					isPaid(next)
						? `Pagamento registrado: ${ORDER_PAYMENT_LABELS[next]}.`
						: "Pedido marcado como não pago.",
				)
			}
		/>
	);
}
