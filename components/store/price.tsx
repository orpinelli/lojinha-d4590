import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/modules/shared/domain/money";

export function Price({
	cents,
	className,
	...props
}: ComponentProps<"span"> & { cents: number }) {
	return (
		<span className={cn("text-foreground", className)} {...props}>
			{formatPrice(cents)}
		</span>
	);
}
