import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Used by the product page and the cart (same control, two sizes). */
export function QuantityStepper({
	value,
	onDecrement,
	onIncrement,
	min = 1,
	size = "md",
	itemLabel,
	className,
}: {
	value: number;
	onDecrement: () => void;
	onIncrement: () => void;
	min?: number;
	size?: "sm" | "md";
	/** Product name, so screen readers know which line the buttons change. */
	itemLabel?: string;
	className?: string;
}) {
	const buttonClass = size === "sm" ? "size-9 rounded-[10px]" : "size-11";
	return (
		<div className={cn("flex items-center gap-2 pb-1 sm:gap-3", className)}>
			<Button
				variant="outline"
				size="icon"
				onClick={onDecrement}
				disabled={value <= min}
				aria-label={itemLabel ? `Diminuir quantidade de ${itemLabel}` : "Diminuir quantidade"}
				className={buttonClass}
			>
				<Minus />
			</Button>
			<span
				aria-live="polite"
				className={cn(
					"text-center font-extrabold text-foreground tabular-nums",
					size === "sm" ? "w-7 text-base" : "w-10 text-xl",
				)}
			>
				{value}
			</span>
			<Button
				variant="outline"
				size="icon"
				onClick={onIncrement}
				aria-label={itemLabel ? `Aumentar quantidade de ${itemLabel}` : "Aumentar quantidade"}
				className={buttonClass}
			>
				<Plus />
			</Button>
		</div>
	);
}
