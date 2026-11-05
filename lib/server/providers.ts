import "server-only";
import path from "node:path";
import { cookies } from "next/headers";
import { createLocalAuthGateway, type CookieJar } from "@/modules/auth/infrastructure/local-auth-gateway";
import { createSupabaseAuthGateway } from "@/modules/auth/infrastructure/supabase-auth-gateway";
import type { AdminAuthGateway } from "@/modules/auth/domain/auth";
import type { CatalogRepositories } from "@/modules/catalog/domain/repositories";
import { createLocalCatalogRepositories } from "@/modules/catalog/infrastructure/local-catalog-repositories";
import { createSupabaseCatalogRepositories } from "@/modules/catalog/infrastructure/supabase-catalog-repositories";
import type { MediaStorage } from "@/modules/media/domain/media";
import {
	createLocalMediaStorage,
	type LocalMediaStorage,
} from "@/modules/media/infrastructure/local-media-storage";
import { createSupabaseMediaStorage } from "@/modules/media/infrastructure/supabase-media-storage";
import type { SettingsRepository } from "@/modules/settings/domain/site-settings";
import { createLocalSettingsRepository } from "@/modules/settings/infrastructure/local-settings-repository";
import { createSupabaseSettingsRepository } from "@/modules/settings/infrastructure/supabase-settings-repository";
import { ConfigurationError } from "@/modules/shared/domain/errors";
import {
	readSupabaseConfig,
	type DataProviderName,
	type SupabaseConfig,
} from "@/lib/supabase/config";
import {
	createSupabasePublicClient,
	createSupabaseSessionClient,
} from "@/lib/supabase/server";

export type PublicInfrastructure = {
	catalog: CatalogRepositories;
	settings: SettingsRepository;
};

export type RequestInfrastructure = PublicInfrastructure & {
	media: MediaStorage;
	auth: AdminAuthGateway;
};

/** Adapter set for one storage backend. */
export interface InfrastructureProvider {
	readonly name: DataProviderName;
	/** Request-independent reads (storefront, static rendering). */
	publicData(): PublicInfrastructure;
	/** Bound to the current request cookies (admin pages and API). */
	forRequest(): Promise<RequestInfrastructure>;
	/** Only the local provider serves uploads itself. */
	readonly localMedia?: LocalMediaStorage;
}

async function nextCookieJar(): Promise<CookieJar> {
	const store = await cookies();
	return {
		get: (name) => store.get(name)?.value,
		set: (name, value, expires) =>
			store.set(name, value, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				expires,
			}),
		delete: (name) => store.delete(name),
	};
}

export function createLocalProvider(): InfrastructureProvider {
	// Development-only storage: keep it out of the deployment file tracing.
	const root = path.resolve(/*turbopackIgnore: true*/ process.env.LOCAL_STORAGE_DIR || ".storage");
	const data: PublicInfrastructure = {
		catalog: createLocalCatalogRepositories(path.join(root, "catalog.json")),
		settings: createLocalSettingsRepository(path.join(root, "settings.json")),
	};
	const localMedia = createLocalMediaStorage(path.join(root, "uploads"));

	return {
		name: "local",
		localMedia,
		publicData: () => data,
		async forRequest() {
			return {
				...data,
				media: localMedia,
				auth: createLocalAuthGateway(await nextCookieJar()),
			};
		},
	};
}

export function createSupabaseProvider(config: SupabaseConfig): InfrastructureProvider {
	const publicClient = createSupabasePublicClient(config);
	const data: PublicInfrastructure = {
		catalog: createSupabaseCatalogRepositories(publicClient),
		settings: createSupabaseSettingsRepository(publicClient),
	};

	return {
		name: "supabase",
		publicData: () => data,
		async forRequest() {
			const client = await createSupabaseSessionClient(config);
			return {
				catalog: createSupabaseCatalogRepositories(client),
				settings: createSupabaseSettingsRepository(client),
				media: createSupabaseMediaStorage(client),
				auth: createSupabaseAuthGateway(client),
			};
		},
	};
}

export function createProvider(name: DataProviderName): InfrastructureProvider {
	if (name === "local") return createLocalProvider();
	const config = readSupabaseConfig();
	if (!config) {
		throw new ConfigurationError(
			"DATA_PROVIDER=supabase exige SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY.",
		);
	}
	return createSupabaseProvider(config);
}
