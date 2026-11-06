import { z } from "zod";
import {
	assetUrlSchema,
	hexColorSchema,
	optionalHttpsUrlSchema,
} from "@/modules/shared/domain/validation";

const text = (max: number) =>
	z.string().trim().max(max, `Use no máximo ${max} caracteres.`);

export const brandingSchema = z.object({
	storeName: text(60).min(1, "Informe o nome da loja."),
	description: text(200),
	logoUrl: assetUrlSchema,
	faviconUrl: assetUrlSchema,
	invertFooterLogo: z.boolean(),
});

export const themeSchema = z.object({
	primary: hexColorSchema,
	primaryForeground: hexColorSchema,
	background: hexColorSchema,
	foreground: hexColorSchema,
	mutedForeground: hexColorSchema,
	footerBackground: hexColorSchema,
	footerForeground: hexColorSchema,
});

export const heroSchema = z.object({
	title: text(60),
	highlight: text(60),
	subtitle: text(300),
	/** Button that scrolls to the products (empty = hidden). */
	primaryCta: text(30),
	/** Button that opens WhatsApp (empty = hidden). */
	secondaryCta: text(30),
});

/** Highlight badges now come from each "Destaque" showcase title. */
export const labelsSchema = z.object({
	shipping: text(30),
});

export const contactSchema = z.object({
	whatsappNumber: z
		.string()
		.trim()
		.regex(
			/^\d{10,15}$/,
			"Use só números, com DDI e DDD. Ex.: 5519999999999.",
		),
	orderGreeting: text(300).min(1, "Informe a mensagem inicial do pedido."),
	instagramUrl: optionalHttpsUrlSchema,
});

export const footerSchema = z.object({
	copyright: text(160),
});

export const settingsSectionSchemas = {
	branding: brandingSchema,
	theme: themeSchema,
	hero: heroSchema,
	labels: labelsSchema,
	contact: contactSchema,
	footer: footerSchema,
} as const;

export type SettingsSection = keyof typeof settingsSectionSchemas;

export const SETTINGS_SECTIONS = Object.keys(
	settingsSectionSchemas,
) as SettingsSection[];

export const siteSettingsSchema = z.object(settingsSectionSchemas);

/** A PATCH replaces whole sections; each section sent must be complete. */
export const settingsPatchSchema = siteSettingsSchema
	.partial()
	.refine((patch) => Object.keys(patch).length > 0, "Nada para salvar.");

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type SettingsPatch = Partial<SiteSettings>;
export type ThemeSettings = SiteSettings["theme"];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads persisted settings defensively: stored values override defaults per
 * field, and a section that fails validation falls back to its default.
 * New fields added in the future therefore never break old data.
 */
export function normalizeSiteSettings(
	raw: unknown,
	defaults: SiteSettings,
): SiteSettings {
	const stored = isRecord(raw) ? raw : {};
	const result: Partial<Record<SettingsSection, unknown>> = {};
	for (const section of SETTINGS_SECTIONS) {
		const storedSection = stored[section];
		const candidate = {
			...defaults[section],
			...(isRecord(storedSection) ? storedSection : {}),
		};
		const parsed = settingsSectionSchemas[section].safeParse(candidate);
		result[section] = parsed.success ? parsed.data : defaults[section];
	}
	return result as SiteSettings;
}
