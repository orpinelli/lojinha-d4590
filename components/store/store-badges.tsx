"use client";

import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { cn } from "@/lib/utils";

/** "Frete Grátis" (text managed in the admin; hidden when empty). */
export function ShippingBadge({ className }: { className?: string }) {
	const { labels } = useSiteSettings();
	if (!labels.shipping) return null;
	return (
		<Badge
			variant="outline"
			className={cn("whitespace-nowrap font-light text-muted-foreground", className)}
		>
			{labels.shipping}
		</Badge>
	);
}

/** Highlight seal; the text is the title of the "Destaque" showcase. */
export function FeaturedBadge({ label, className }: { label?: string; className?: string }) {
	if (!label) return null;
	return (
		<div
			className={cn(
				"inline-flex max-w-[calc(100%-2rem)] items-center gap-1.5 rounded-full border border-primary-hover bg-primary px-3 py-1 text-primary-foreground shadow-md",
				className,
			)}
		>
			<Star className="size-3 shrink-0 fill-current" aria-hidden />
			<span className="truncate text-xs font-medium tracking-wide uppercase">{label}</span>
		</div>
	);
}
