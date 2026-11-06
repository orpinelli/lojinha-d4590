import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* Server-compatible compound components shared by every admin page. */

export const PageHeader = {
	Root: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn(
				"mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between",
				className,
			)}
			{...props}
		/>
	),
	Content: ({ className, ...props }: ComponentProps<"div">) => (
		<div className={cn("min-w-0 space-y-1.5", className)} {...props} />
	),
	Title: ({ className, ...props }: ComponentProps<"h1">) => (
		<h1
			className={cn(
				"font-display text-3xl leading-tight font-semibold break-words text-foreground sm:text-4xl",
				className,
			)}
			{...props}
		/>
	),
	Description: ({ className, ...props }: ComponentProps<"p">) => (
		<p className={cn("text-[15px] text-muted-foreground", className)} {...props} />
	),
	Actions: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn("flex flex-wrap gap-3 pb-1 *:flex-1 sm:shrink-0 sm:*:flex-none", className)}
			{...props}
		/>
	),
};

export const FormSection = {
	Root: ({ className, ...props }: ComponentProps<typeof Card>) => (
		<Card className={cn("gap-0 py-0", className)} {...props} />
	),
	Header: ({
		title,
		description,
		className,
	}: {
		title: ReactNode;
		description?: ReactNode;
		className?: string;
	}) => (
		<div className={cn("space-y-1 border-b-2 px-4 py-4 sm:px-6", className)}>
			<h2 className="font-display text-xl leading-tight font-semibold text-foreground">{title}</h2>
			{description && <p className="text-sm text-muted-foreground">{description}</p>}
		</div>
	),
	// grid-cols-1 = minmax(0, 1fr): long unbreakable content can't widen the card.
	Content: ({ className, ...props }: ComponentProps<"div">) => (
		<div className={cn("grid grid-cols-1 gap-5 px-4 py-5 sm:px-6", className)} {...props} />
	),
	Footer: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn(
				"flex flex-col-reverse gap-3 border-t-2 px-4 pt-4 pb-5 sm:flex-row sm:justify-end sm:px-6",
				className,
			)}
			{...props}
		/>
	),
};

/** Sticky on phones so the save button is always reachable on long forms. */
export function FormActions({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"sticky bottom-0 z-20 -mx-4 flex flex-col-reverse gap-3 border-t-2 bg-background/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:pb-1 sm:backdrop-blur-none",
				className,
			)}
			{...props}
		/>
	);
}

export const EmptyState = {
	Root: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn(
				"flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center",
				className,
			)}
			{...props}
		/>
	),
	Icon: ({ children }: { children: ReactNode }) => (
		<div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:size-7">
			{children}
		</div>
	),
	Title: ({ className, ...props }: ComponentProps<"h2">) => (
		<h2 className={cn("font-display text-xl font-semibold text-foreground", className)} {...props} />
	),
	Description: ({ className, ...props }: ComponentProps<"p">) => (
		<p className={cn("max-w-sm text-sm text-muted-foreground", className)} {...props} />
	),
	Action: ({ className, ...props }: ComponentProps<"div">) => (
		<div className={cn("mt-2 pb-1", className)} {...props} />
	),
};

export const StatCard = {
	Root: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn("flex flex-col gap-2 rounded-2xl border-2 bg-background p-4", className)}
			{...props}
		/>
	),
	Label: ({ className, ...props }: ComponentProps<"p">) => (
		<p
			className={cn("text-[11px] font-extrabold tracking-[1.5px] text-label uppercase", className)}
			{...props}
		/>
	),
	Value: ({ className, ...props }: ComponentProps<"p">) => (
		<p
			className={cn("font-display text-3xl font-semibold text-foreground tabular-nums sm:text-4xl", className)}
			{...props}
		/>
	),
};

/** Mobile-first list (no horizontal scrolling tables). */
export const ResourceList = {
	Root: ({ className, ...props }: ComponentProps<"ul">) => (
		<ul
			className={cn("divide-y-2 overflow-hidden rounded-2xl border-2 bg-background", className)}
			{...props}
		/>
	),
	Item: ({ className, ...props }: ComponentProps<"li">) => (
		<li
			className={cn(
				"flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4 sm:p-4",
				className,
			)}
			{...props}
		/>
	),
	Media: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn("relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-16", className)}
			{...props}
		/>
	),
	Content: ({ className, ...props }: ComponentProps<"div">) => (
		<div className={cn("min-w-0 flex-1 space-y-1.5", className)} {...props} />
	),
	Title: ({ className, ...props }: ComponentProps<"p">) => (
		<p className={cn("truncate font-bold text-foreground", className)} {...props} />
	),
	Meta: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn(
				"flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-semibold text-muted-foreground",
				className,
			)}
			{...props}
		/>
	),
	Actions: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn("flex w-full shrink-0 items-center justify-end gap-2 pb-1 sm:w-auto", className)}
			{...props}
		/>
	),
};

/** "Pressable" card: thicker bottom border that sinks on click (3D, like buttons). */
export function ShortcutCard({
	href,
	icon,
	title,
	description,
}: {
	href: string;
	icon: ReactNode;
	title: string;
	description: string;
}) {
	return (
		<Link
			href={href}
			className="group flex items-center gap-4 rounded-2xl border-2 border-b-4 bg-background p-4 transition-[background-color,border-color,transform] hover:border-primary/40 hover:bg-primary/5 active:translate-y-0.5 active:border-b-2"
		>
			<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-5">
				{icon}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block font-extrabold text-foreground">{title}</span>
				<span className="block text-sm text-muted-foreground">{description}</span>
			</span>
			<ChevronRight
				className="size-5 shrink-0 text-label transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
				strokeWidth={3}
			/>
		</Link>
	);
}
