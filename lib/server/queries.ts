import "server-only";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { getStorefrontServices } from "./container";

/** Memoized per request so layout + page share one read. */
export const getSiteSettings = cache(() => getStorefrontServices().settings.get());

export const getStorefront = cache(() =>
	getStorefrontServices().catalog.getStorefront(),
);

export const getPublicProduct = cache((id: string) =>
	getStorefrontServices().catalog.getPublicProduct(id),
);

/** Call after any admin change: regenerates every storefront page. */
export function revalidateStorefront() {
	revalidatePath("/", "layout");
}
