"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteSettings } from "@/modules/settings/domain/site-settings";

const SiteSettingsContext = createContext<SiteSettings | null>(null);

/** Makes the admin-managed settings available to storefront client parts. */
export function SiteSettingsProvider({
	settings,
	children,
}: {
	settings: SiteSettings;
	children: ReactNode;
}) {
	return (
		<SiteSettingsContext.Provider value={settings}>
			{children}
		</SiteSettingsContext.Provider>
	);
}

export function useSiteSettings(): SiteSettings {
	const settings = useContext(SiteSettingsContext);
	if (!settings) {
		throw new Error("useSiteSettings deve ser usado dentro de <SiteSettingsProvider>");
	}
	return settings;
}
