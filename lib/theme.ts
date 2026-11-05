import type { ThemeSettings } from "@/modules/settings/domain/site-settings";

const CSS_VARIABLES: Record<keyof ThemeSettings, string> = {
	primary: "--primary",
	primaryForeground: "--primary-foreground",
	background: "--background",
	foreground: "--foreground",
	mutedForeground: "--muted-foreground",
	footerBackground: "--footer",
	footerForeground: "--footer-foreground",
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Maps admin colors to the design tokens consumed by Tailwind classes
 * (bg-primary, text-foreground...). Re-validates every value so nothing but a
 * hex color can ever reach a <style> tag.
 */
export function themeToCssVariables(theme: Partial<ThemeSettings>): Record<string, string> {
	const variables: Record<string, string> = {};
	for (const [key, variable] of Object.entries(CSS_VARIABLES)) {
		const value = theme[key as keyof ThemeSettings];
		if (typeof value === "string" && HEX_COLOR.test(value)) variables[variable] = value;
	}
	return variables;
}

export function themeToCss(theme: ThemeSettings, selector = ":root:root"): string {
	const declarations = Object.entries(themeToCssVariables(theme))
		.map(([variable, value]) => `${variable}:${value}`)
		.join(";");
	return `${selector}{${declarations}}`;
}
