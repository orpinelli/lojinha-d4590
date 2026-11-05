import type { Showcase } from "../domain/showcase";

const SEEDED_AT = "2026-01-01T00:00:00.000Z";

type SeedShowcase = Omit<Showcase, "createdAt" | "updatedAt" | "productIds" | "categoryIds" | "excludedProductIds"> &
	Partial<Pick<Showcase, "productIds" | "categoryIds">>;

const showcase = ({ productIds = [], categoryIds = [], ...data }: SeedShowcase): Showcase => ({
	...data,
	productIds,
	categoryIds,
	excludedProductIds: [],
	createdAt: SEEDED_AT,
	updatedAt: SEEDED_AT,
});

/** Same home page as before showcases existed: highlight + one section per category. */
export function showcaseSeed(): Showcase[] {
	return [
		showcase({
			id: "mais-vendido",
			title: "Mais Vendido",
			layout: "featured",
			source: "products",
			productIds: ["12"],
			active: true,
			position: 0,
		}),
		showcase({
			id: "vestuario",
			title: "Vestuário",
			layout: "grid",
			source: "categories",
			categoryIds: ["vestuario"],
			active: true,
			position: 1,
		}),
		showcase({
			id: "acessorios",
			title: "Acessórios",
			layout: "grid",
			source: "categories",
			categoryIds: ["acessorios"],
			active: true,
			position: 2,
		}),
		showcase({
			id: "combos",
			title: "Combos",
			layout: "grid",
			source: "categories",
			categoryIds: ["combos"],
			active: true,
			position: 3,
		}),
	];
}
