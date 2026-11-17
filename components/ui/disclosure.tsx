"use client";

import { createContext, useContext, useId, useState, type ComponentProps, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Section that opens and closes like a drawer:
 *
 * <DisclosureRoot defaultOpen>
 *   <DisclosureTrigger>Title</DisclosureTrigger>
 *   <DisclosureContent>…</DisclosureContent>
 * </DisclosureRoot>
 *
 * Controlled (`open` + `onOpenChange`) or not (`defaultOpen`). The content
 * slides open; when closed it leaves the tab order and the accessibility tree.
 */

type DisclosureContextValue = {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerId: string;
	contentId: string;
};

const DisclosureContext = createContext<DisclosureContextValue | null>(null);

function useDisclosure() {
	const context = useContext(DisclosureContext);
	if (!context) throw new Error("Use as partes do Disclosure dentro de <DisclosureRoot>");
	return context;
}

/** Read the open state from inside a drawer (e.g. to show a summary only when closed). */
export function useDisclosureOpen(): boolean {
	return useDisclosure().open;
}

export function DisclosureRoot({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	className,
	...props
}: ComponentProps<"section"> & {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const id = useId();
	const setOpen = (next: boolean) => {
		if (openProp === undefined) setUncontrolled(next);
		onOpenChange?.(next);
	};
	return (
		<DisclosureContext.Provider
			value={{ open, setOpen, triggerId: `${id}-trigger`, contentId: `${id}-content` }}
		>
			<section data-state={open ? "open" : "closed"} className={className} {...props} />
		</DisclosureContext.Provider>
	);
}

/** Full-width header button with a chevron; the children are the title (and an optional summary). */
export function DisclosureTrigger({ className, children, ...props }: ComponentProps<"button">) {
	const { open, setOpen, triggerId, contentId } = useDisclosure();
	return (
		<button
			type="button"
			id={triggerId}
			aria-expanded={open}
			aria-controls={contentId}
			onClick={() => setOpen(!open)}
			className={cn(
				"flex w-full items-center gap-3 text-left focus-visible:ring-[3px] focus-visible:ring-link/40 focus-visible:outline-none",
				className,
			)}
			{...props}
		>
			<span className="min-w-0 flex-1">{children}</span>
			<ChevronDown
				className={cn(
					"size-5 shrink-0 text-label transition-transform duration-200 motion-reduce:transition-none",
					open && "rotate-180",
				)}
				strokeWidth={2.5}
				aria-hidden
			/>
		</button>
	);
}

/** Slides open and closed (rows 0fr ↔ 1fr); `className` styles the inner padding box. */
export function DisclosureContent({ className, children }: { className?: string; children: ReactNode }) {
	const { open, triggerId, contentId } = useDisclosure();
	return (
		<div
			id={contentId}
			role="region"
			aria-labelledby={triggerId}
			className={cn(
				"grid duration-200 ease-out motion-reduce:transition-none",
				// Opening: visible at once (the content can take the focus right away).
				// Closing: stays visible while it slides shut, then leaves the tab order.
				open
					? "visible grid-rows-[1fr] transition-[grid-template-rows]"
					: "invisible grid-rows-[0fr] transition-[grid-template-rows,visibility]",
			)}
		>
			<div className="min-h-0 overflow-hidden">
				<div className={className}>{children}</div>
			</div>
		</div>
	);
}
