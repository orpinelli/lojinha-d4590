import type React from "react";
import { CartProvider } from "@/contexts/cart-context";
import { SiteSettingsProvider } from "@/contexts/site-settings-context";
import { getSiteSettings } from "@/lib/server/queries";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
	const settings = await getSiteSettings();

	return (
		<SiteSettingsProvider settings={settings}>
			<CartProvider>
				<div data-storefront className="min-h-screen bg-background text-foreground">
					{children}
				</div>
			</CartProvider>
		</SiteSettingsProvider>
	);
}
