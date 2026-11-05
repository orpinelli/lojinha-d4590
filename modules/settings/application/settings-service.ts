import { parseInput } from "@/modules/shared/domain/validation";
import { settingsPatchSchema } from "../domain/site-settings-schemas";
import type { SettingsRepository, SiteSettings } from "../domain/site-settings";

export function createSettingsService(repository: SettingsRepository) {
	return {
		get(): Promise<SiteSettings> {
			return repository.get();
		},

		update(rawPatch: unknown): Promise<SiteSettings> {
			return repository.saveSections(parseInput(settingsPatchSchema, rawPatch));
		},
	};
}

export type SettingsService = ReturnType<typeof createSettingsService>;
