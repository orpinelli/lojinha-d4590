/** Zod-free entry point for settings types (safe for client bundles). */
export type {
	SettingsPatch,
	SettingsSection,
	SiteSettings,
	ThemeSettings,
} from "./site-settings-schemas";

import type { SettingsPatch, SiteSettings } from "./site-settings-schemas";

/** Port implemented by each storage adapter. */
export interface SettingsRepository {
	get(): Promise<SiteSettings>;
	saveSections(patch: SettingsPatch): Promise<SiteSettings>;
}
