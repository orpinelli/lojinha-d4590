"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ToggleChip } from "@/components/admin/form-fields/collection-fields";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/modules/orders/domain/order";

/** One tap changes the status (saved right away). */
export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
	const mutate = useAdminMutation();
	const [pending, setPending] = useState<OrderStatus | null>(null);

	const change = async (next: OrderStatus) => {
		if (next === status || pending) return;
		setPending(next);
		await mutate(() => adminApi.updateOrderStatus(orderId, next), {
			successMessage: `Status alterado para ${ORDER_STATUS_LABELS[next]}.`,
		});
		setPending(null);
	};

	return (
		<div role="group" aria-label="Status do pedido" className="grid grid-cols-2 gap-2 pb-1">
			{ORDER_STATUSES.map((value) => (
				<ToggleChip
					key={value}
					pressed={value === status}
					disabled={pending !== null}
					onClick={() => change(value)}
					className="inline-flex items-center justify-center gap-2 disabled:opacity-60"
				>
					{pending === value && <Loader2 className="size-4 animate-spin" />}
					{ORDER_STATUS_LABELS[value]}
				</ToggleChip>
			))}
		</div>
	);
}
