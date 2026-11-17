import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Selectable card around a native radio (keyboard and screen readers work out
 * of the box). Used by the admin choice fields and by the cart. Wrap a group
 * in an element with `role="radiogroup"` and give every card the same `name`.
 */
export function RadioCard({
	className,
	children,
	...inputProps
}: Omit<ComponentProps<"input">, "type" | "className" | "children"> & {
	className?: string;
	children: ReactNode;
}) {
	return (
		<label
			className={cn(
				"flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-b-4 bg-background p-3 transition-[background-color,border-color,transform] hover:bg-muted active:translate-y-0.5 active:border-b-2 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-link/40",
				className,
			)}
		>
			<input type="radio" className="mt-0.5 size-4 shrink-0 accent-primary" {...inputProps} />
			<span className="min-w-0">{children}</span>
		</label>
	);
}
