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
		<div className={cn("min-w-0 space-y-1", className)} {...props} />
	),
	Title: ({ className, ...props }: ComponentProps<"h1">) => (
		<h1
			className={cn("text-2xl font-semibold tracking-tight break-words sm:text-3xl", className)}
			{...props}
		/>
	),
	Description: ({ className, ...props }: ComponentProps<"p">) => (
		<p className={cn("text-sm text-muted-foreground", className)} {...props} />
	),
	Actions: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn("flex flex-wrap gap-2 *:flex-1 sm:shrink-0 sm:*:flex-none", className)}
			{...props}
		/>
	),
};

export const FormSection = {
	Root: ({ className, ...props }: ComponentProps<typeof Card>) => (
		<Card className={cn("gap-0 bg-background py-0 shadow-xs", className)} {...props} />
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
		<div className={cn("space-y-1 border-b px-4 py-4 sm:px-6", className)}>
			<h2 className="text-base font-semibold">{title}</h2>
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
				"flex flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6",
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
				"sticky bottom-0 z-20 -mx-4 flex flex-col-reverse gap-2 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
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
				"flex flex-col items-center gap-3 rounded-lg border border-dashed bg-background px-6 py-12 text-center",
				className,
			)}
			{...props}
		/>
	),
	Icon: ({ children }: { children: ReactNode }) => (
		<div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
			{children}
		</div>
	),
	Title: ({ className, ...props }: ComponentProps<"h2">) => (
		<h2 className={cn("text-base font-semibold", className)} {...props} />
	),
	Description: ({ className, ...props }: ComponentProps<"p">) => (
		<p className={cn("max-w-sm text-sm text-muted-foreground", className)} {...props} />
	),
	Action: ({ className, ...props }: ComponentProps<"div">) => (
		<div className={cn("mt-2", className)} {...props} />
	),
};

export const StatCard = {
	Root: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn("flex flex-col gap-1 rounded-lg border bg-background p-4", className)}
			{...props}
		/>
	),
	Label: ({ className, ...props }: ComponentProps<"p">) => (
		<p className={cn("text-xs text-muted-foreground sm:text-sm", className)} {...props} />
	),
	Value: ({ className, ...props }: ComponentProps<"p">) => (
		<p className={cn("text-2xl font-semibold tabular-nums sm:text-3xl", className)} {...props} />
	),
};

/** Mobile-first list (no horizontal scrolling tables). */
export const ResourceList = {
	Root: ({ className, ...props }: ComponentProps<"ul">) => (
		<ul
			className={cn("divide-y overflow-hidden rounded-lg border bg-background", className)}
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
			className={cn("relative size-14 shrink-0 overflow-hidden rounded-md bg-muted sm:size-16", className)}
			{...props}
		/>
	),
	Content: ({ className, ...props }: ComponentProps<"div">) => (
		<div className={cn("min-w-0 flex-1 space-y-1", className)} {...props} />
	),
	Title: ({ className, ...props }: ComponentProps<"p">) => (
		<p className={cn("truncate font-medium", className)} {...props} />
	),
	Meta: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn(
				"flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground",
				className,
			)}
			{...props}
		/>
	),
	Actions: ({ className, ...props }: ComponentProps<"div">) => (
		<div
			className={cn("flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto", className)}
			{...props}
		/>
	),
};

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
			className="group flex items-center gap-4 rounded-lg border bg-background p-4 transition-colors hover:border-primary"
		>
			<span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-5">
				{icon}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block font-medium">{title}</span>
				<span className="block text-sm text-muted-foreground">{description}</span>
			</span>
			<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}
