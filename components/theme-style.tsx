import { themeToCss } from "@/lib/theme";
import type { ThemeSettings } from "@/modules/settings/domain/site-settings";

/** Injects the admin-managed colors as CSS variables (server-rendered, no flash). */
export function ThemeStyle({ theme }: { theme: ThemeSettings }) {
	return <style id="store-theme" dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />;
}
