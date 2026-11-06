"use client";

import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings } from "@/contexts/site-settings-context";

/** "Frete Grátis" pill (text managed in the admin; hidden when empty). */
export function ShippingBadge({ className }: { className?: string }) {
	const { labels } = useSiteSettings();
	if (!labels.shipping) return null;
	return (
		<Badge variant="info" shape="pill" className={className}>
			{labels.shipping}
		</Badge>
	);
}

/** Highlight seal; the text is the title of the "Destaque" showcase. */
export function FeaturedBadge({ label, className }: { label?: string; className?: string }) {
	if (!label) return null;
	return (
		<Badge className={className}>
			<Star className="fill-current" aria-hidden />
			<span className="truncate">{label}</span>
		</Badge>
	);
}
