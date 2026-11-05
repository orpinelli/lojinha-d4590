import "server-only";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { getStorefrontServices } from "./container";

/** Memoized per request so layout + page share one read. */
export const getSiteSettings = cache(() => getStorefrontServices().settings.get());

/** Home page: visible showcases with their products, in page order. */
export const getHomeShowcases = cache(() => getStorefrontServices().showcases.getHome());

export const getPublicProduct = cache((id: string) =>
	getStorefrontServices().catalog.getPublicProduct(id),
);

/** Call after any admin change: regenerates every storefront page. */
export function revalidateStorefront() {
	revalidatePath("/", "layout");
}
