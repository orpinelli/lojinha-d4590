/// <reference types="vitest/globals" />
import { defaultSiteSettings } from "../infrastructure/settings-seed";
import { contactSchema, normalizeSiteSettings } from "./site-settings-schemas";

describe("site settings", () => {
	it("fills missing fields of a stored section with the defaults", () => {
		const settings = normalizeSiteSettings(
			{ hero: { title: "Nova loja" } },
			defaultSiteSettings(),
		);
		expect(settings.hero.title).toBe("Nova loja");
		expect(settings.hero.primaryCta).toBe("Ver produtos");
	});

	it("falls back to the defaults when a stored section is invalid", () => {
		const settings = normalizeSiteSettings(
			{ theme: { primary: "red" } },
			defaultSiteSettings(),
		);
		expect(settings.theme).toEqual(defaultSiteSettings().theme);
	});

	it("keeps showing a WhatsApp number saved under the older rule", () => {
		const settings = normalizeSiteSettings(
			{ contact: { ...defaultSiteSettings().contact, whatsappNumber: "123" } },
			defaultSiteSettings(),
		);
		expect(settings.contact.whatsappNumber).toBe("123");
	});

	it("saves the WhatsApp number normalized and rejects invalid ones", () => {
		const base = defaultSiteSettings().contact;
		const parsed = contactSchema.parse({ ...base, whatsappNumber: "(19) 99180-1697" });
		expect(parsed.whatsappNumber).toBe("5519991801697");
		expect(contactSchema.safeParse({ ...base, whatsappNumber: "123" }).success).toBe(false);
	});
});
