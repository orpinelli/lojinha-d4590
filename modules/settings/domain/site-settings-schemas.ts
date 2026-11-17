import { z } from "zod";
import {
	assetUrlSchema,
	hexColorSchema,
	optionalHttpsUrlSchema,
} from "@/modules/shared/domain/validation";
import { isValidWhatsapp, normalizeWhatsapp } from "@/modules/shared/domain/phone";

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

/**
 * Store title at the top of the home: `title` in the main color, then
 * `highlight` in the text color. (The old subtitle and buttons were dropped:
 * stored values for them are simply ignored.)
 */
export const heroSchema = z.object({
	title: text(60),
	highlight: text(60),
});

/** Highlight badges now come from each "Destaque" showcase title. */
export const labelsSchema = z.object({
	/** Delivery pill next to the price (empty = hidden). */
	shipping: text(40),
});

export const contactSchema = z.object({
	/** Any typing style is accepted; stored as digits only, with the country code. */
	whatsappNumber: z
		.string()
		.transform(normalizeWhatsapp)
		.refine(isValidWhatsapp, "Número inválido. Confira o DDD e os dígitos. Ex.: +55 19 99999-9999."),
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

/**
 * Reading is more lenient than saving: a WhatsApp number saved under the older,
 * looser rule keeps showing (instead of the whole contact section falling back
 * to defaults) and can be corrected in the panel, where the strict rule applies.
 */
const storedSectionSchemas = {
	...settingsSectionSchemas,
	contact: contactSchema.extend({ whatsappNumber: z.string().transform(normalizeWhatsapp) }),
};

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
		const parsed = storedSectionSchemas[section].safeParse(candidate);
		result[section] = parsed.success ? parsed.data : defaults[section];
	}
	return result as SiteSettings;
}
