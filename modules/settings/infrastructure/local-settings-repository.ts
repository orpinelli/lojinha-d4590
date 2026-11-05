import "server-only";
import { createJsonFileStore } from "@/modules/shared/infrastructure/json-file-store";
import type { SettingsRepository, SiteSettings } from "../domain/site-settings";
import { normalizeSiteSettings } from "../domain/site-settings-schemas";
import { defaultSiteSettings } from "./settings-seed";

export function createLocalSettingsRepository(filePath: string): SettingsRepository {
	const store = createJsonFileStore<SiteSettings>({
		filePath,
		seed: defaultSiteSettings,
		normalize: (raw) => normalizeSiteSettings(raw, defaultSiteSettings()),
	});

	return {
		get: () => store.read(),
		saveSections: (patch) =>
			store.update((settings) => {
				Object.assign(settings, patch);
				return settings;
			}),
	};
}
