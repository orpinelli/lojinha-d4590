import "server-only";
import { createAuthService } from "@/modules/auth/application/auth-service";
import { createCatalogService } from "@/modules/catalog/application/catalog-service";
import { createMediaService } from "@/modules/media/application/media-service";
import { createSettingsService } from "@/modules/settings/application/settings-service";
import { createShowcaseService } from "@/modules/showcase/application/showcase-service";
import { resolveDataProvider } from "@/lib/supabase/config";
import { createProvider, type InfrastructureProvider, type PublicInfrastructure } from "./providers";

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

function buildServices({ catalog, settings, showcases }: PublicInfrastructure) {
	return {
		catalog: createCatalogService(catalog),
		settings: createSettingsService(settings),
		showcases: createShowcaseService({ ...catalog, showcases }),
	};
}

/** Public, cookie-free services (storefront pages, public API reads). */
export function getStorefrontServices() {
	return buildServices(getProvider().publicData());
}

/** Services bound to the current request (admin pages, mutations, auth). */
export async function getRequestServices() {
	const infrastructure = await getProvider().forRequest();
	return {
		...buildServices(infrastructure),
		media: createMediaService(infrastructure.media),
		auth: createAuthService(infrastructure.auth),
	};
}

export type RequestServices = Awaited<ReturnType<typeof getRequestServices>>;

export function readLocalMedia(fileName: string) {
	return getProvider().localMedia?.read(fileName) ?? Promise.resolve(null);
}
