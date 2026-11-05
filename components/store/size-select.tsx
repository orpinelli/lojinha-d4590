"use client";

import { useEffect, useRef } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PULSE = "color-mix(in oklab, var(--destructive) 32%, transparent)";
const REST = "color-mix(in oklab, var(--destructive) 0%, transparent)";

/** Gentle red pulse played when a size is required but missing. */
const ATTENTION_KEYFRAMES: Keyframe[] = [
	{ transform: "scale(1)", boxShadow: `0 0 0 0 ${REST}` },
	{ transform: "scale(1.035)", boxShadow: `0 0 0 5px ${PULSE}` },
	{ transform: "scale(1)", boxShadow: `0 0 0 0 ${REST}` },
];

/**
 * The single size picker used by cards, featured product and product page.
 * `invalid` keeps it red; every increment of `attention` replays the pulse
 * (and focuses it, so keyboard and screen-reader users notice too).
 */
export function SizeSelect({
	sizes,
	value,
	onValueChange,
	placeholder = "Selecione o tamanho",
	triggerClassName,
	label = "Tamanho",
	invalid = false,
	attention = 0,
	focusOnAttention = true,
}: {
	sizes: string[];
	value: string;
	onValueChange: (size: string) => void;
	placeholder?: string;
	triggerClassName?: string;
	label?: string;
	invalid?: boolean;
	attention?: number;
	focusOnAttention?: boolean;
}) {
	const triggerRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const trigger = triggerRef.current;
		if (!attention || !invalid || !trigger) return;
		if (focusOnAttention) {
			trigger.focus({ preventScroll: true });
			trigger.scrollIntoView({ block: "nearest", behavior: "smooth" });
		}
		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			trigger.animate(ATTENTION_KEYFRAMES, { duration: 420, iterations: 3, easing: "ease-in-out" });
		}
	}, [attention, invalid, focusOnAttention]);

	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger
				ref={triggerRef}
				aria-label={label}
				aria-invalid={invalid || undefined}
				className={cn(
					"w-full transition-colors",
					invalid &&
						"border-destructive bg-destructive/5 text-destructive [&_svg]:text-destructive [&_svg]:opacity-100",
					triggerClassName,
				)}
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{sizes.map((size) => (
					<SelectItem key={size} value={size}>
						{size}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
