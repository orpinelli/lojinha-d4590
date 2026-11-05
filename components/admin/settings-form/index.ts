import { FormSection } from "@/components/admin/blocks";
import { SettingsFormRoot, SettingsFormSubmit, ThemePreview } from "./settings-form";

/**
 * `<SettingsForm.Root section="hero" defaultValues={settings.hero}>`
 *   `<SettingsForm.Header …/><SettingsForm.Content>fields</SettingsForm.Content><SettingsForm.Submit/>`
 */
export const SettingsForm = {
	Root: SettingsFormRoot,
	Header: FormSection.Header,
	Content: FormSection.Content,
	Submit: SettingsFormSubmit,
	ThemePreview,
};
