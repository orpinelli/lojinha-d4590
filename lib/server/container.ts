import "server-only";
import { createAuthService } from "@/modules/auth/application/auth-service";
import { createCatalogService } from "@/modules/catalog/application/catalog-service";
import { createMediaService } from "@/modules/media/application/media-service";
import { createSettingsService } from "@/modules/settings/application/settings-service";
import { resolveDataProvider } from "@/lib/supabase/config";
import { createProvider, type InfrastructureProvider } from "./providers";

/**
 * Composition root: the only place that knows which adapters are in use.
 * UI, API routes and use cases depend on the services, never on storage.
 */
let provider: InfrastructureProvider | undefined;

function getProvider(): InfrastructureProvider {
	provider ??= createProvider(resolveDataProvider());
	return provider;
}

export function getDataProviderName() {
	return getProvider().name;
}

/** Public, cookie-free services (storefront pages, public API reads). */
export function getStorefrontServices() {
	const { catalog, settings } = getProvider().publicData();
	return {
		catalog: createCatalogService(catalog),
		settings: createSettingsService(settings),
	};
}

/** Services bound to the current request (admin pages, mutations, auth). */
export async function getRequestServices() {
	const infrastructure = await getProvider().forRequest();
	return {
		catalog: createCatalogService(infrastructure.catalog),
		settings: createSettingsService(infrastructure.settings),
		media: createMediaService(infrastructure.media),
		auth: createAuthService(infrastructure.auth),
	};
}

export type RequestServices = Awaited<ReturnType<typeof getRequestServices>>;

export function readLocalMedia(fileName: string) {
	return getProvider().localMedia?.read(fileName) ?? Promise.resolve(null);
}
