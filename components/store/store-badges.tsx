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

/** "Mais Vendido" (text managed in the admin; hidden when empty). */
export function FeaturedBadge({ className }: { className?: string }) {
	const { labels } = useSiteSettings();
	if (!labels.featured) return null;
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border border-primary-hover bg-primary px-3 py-1 text-primary-foreground shadow-md",
				className,
			)}
		>
			<Star className="size-3 fill-current" aria-hidden />
			<span className="text-xs font-medium tracking-wide uppercase">{labels.featured}</span>
		</div>
	);
}
