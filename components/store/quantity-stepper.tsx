import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Used by the product page and the cart (same control, two sizes). */
export function QuantityStepper({
	value,
	onDecrement,
	onIncrement,
	min = 1,
	size = "md",
	className,
}: {
	value: number;
	onDecrement: () => void;
	onIncrement: () => void;
	min?: number;
	size?: "sm" | "md";
	className?: string;
}) {
	const buttonSize = size === "sm" ? "size-9" : "size-10";
	const iconSize = size === "sm" ? "size-3" : "size-4";

	return (
		<div className={cn("flex items-center gap-2 sm:gap-3", className)}>
			<Button
				type="button"
				variant="outline"
				onClick={onDecrement}
				disabled={value <= min}
				aria-label="Diminuir quantidade"
				className={cn(buttonSize, "bg-transparent p-0")}
			>
				<Minus className={iconSize} />
			</Button>
			<span
				aria-live="polite"
				className={cn(
					"w-8 text-center text-foreground",
					size === "sm" ? "text-sm font-medium" : "w-10 text-lg font-light sm:text-xl",
				)}
			>
				{value}
			</span>
			<Button
				type="button"
				variant="outline"
				onClick={onIncrement}
				aria-label="Aumentar quantidade"
				className={cn(buttonSize, "bg-transparent p-0")}
			>
				<Plus className={iconSize} />
			</Button>
		</div>
	);
}
