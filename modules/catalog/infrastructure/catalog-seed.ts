import { DEFAULT_SIZES, type Category, type Product } from "../domain/product";

export type CatalogData = { categories: Category[]; products: Product[] };

const SEEDED_AT = "2026-01-01T00:00:00.000Z";
const SIZES = [...DEFAULT_SIZES];

type SeedProduct = Omit<Product, "createdAt" | "updatedAt">;

const category = (id: string, name: string, position: number): Category => ({
	id,
	name,
	position,
	createdAt: SEEDED_AT,
	updatedAt: SEEDED_AT,
});

const product = (data: SeedProduct): Product => ({
	...data,
	createdAt: SEEDED_AT,
	updatedAt: SEEDED_AT,
});

/** Initial catalog (migrated from the old hard-coded lib/products.ts). */
export function catalogSeed(): CatalogData {
	return {
		categories: [
			category("vestuario", "Vestuário", 0),
			category("acessorios", "Acessórios", 1),
			category("combos", "Combos", 2),
		],
		products: [
			product({
				id: "11",
				categoryId: "vestuario",
				name: "Camiseta preta",
				description:
					"Camiseta preta 100% algodão, confortável e versátil para o dia a dia.",
				priceInCents: 6000,
				images: ["/produtos/camisetas/camiseta-preta.png"],
				sizes: SIZES,
				details: {
					title: "Descrição do Produto",
					items: ["Tecido: 100% algodão", "Modelagem unissex"],
				},
				active: true,
				position: 0,
			}),
			product({
				id: "12",
				categoryId: "vestuario",
				name: "Camiseta rosa",
				description:
					"Camiseta rosa 100% algodão, confortável e versátil para o dia a dia.",
				priceInCents: 6000,
				images: ["/produtos/camisetas/camiseta-rosa.png"],
				sizes: SIZES,
				details: {
					title: "Descrição do Produto",
					items: ["Tecido: 100% algodão", "Modelagem unissex"],
				},
				active: true,
				position: 1,
			}),
			product({
				id: "1",
				categoryId: "acessorios",
				name: "Caneca 850mL",
				description:
					"Caneca 850mL em material resistente, ideal para uso diário. Acabamento brilhante e impressão de alta definição.",
				priceInCents: 2500,
				images: ["/produtos/caneca.jpg"],
				sizes: [],
				details: {
					title: "Descrição do Produto",
					items: ["Capacidade: 850mL", "Acabamento brilhante", "Impressão durável"],
				},
				active: true,
				position: 2,
			}),
			product({
				id: "4",
				categoryId: "acessorios",
				name: "Pin",
				description:
					"Tirante 25mm com mosquetão metálico. Confortável para crachá, chaves e eventos.",
				priceInCents: 1500,
				images: ["/produtos/pin.png"],
				sizes: [],
				details: {
					title: "Descrição do Produto",
					items: ["Largura: 25mm", "Comprimento total: ~90cm", "Mosquetão metálico"],
				},
				active: true,
				position: 3,
			}),
			product({
				id: "5",
				categoryId: "acessorios",
				name: "Tirante",
				description:
					"Tirante 25mm com mosquetão metálico. Confortável para crachá, chaves e eventos.",
				priceInCents: 1200,
				images: ["/produtos/tirante.jpg"],
				sizes: [],
				details: { title: "Descrição do Produto", items: ["Mosquetão metálico"] },
				active: true,
				position: 4,
			}),
			product({
				id: "6",
				categoryId: "acessorios",
				name: "Adesivos vinil 5x5cm",
				description:
					"Adesivos em vinil 5x5cm com recorte preciso e resistência à água e à luz.",
				priceInCents: 200,
				images: ["/produtos/adesivos/19.png"],
				sizes: [],
				details: {
					title: "Descrição do Produto",
					items: ["Tamanho: 5x5cm", "Vinil resistente à água", "Adesivo de alta fixação"],
				},
				active: false,
				position: 5,
			}),
			product({
				id: "8",
				categoryId: "combos",
				name: "Caneca + tirante",
				description: "Kit com Caneca e tirante. Presente funcional e versátil.",
				priceInCents: 3000,
				images: [
					"/kit/kit-caneca-tirante.jpeg",
					"/produtos/caneca.jpg",
					"/produtos/tirante.jpg",
				],
				sizes: [],
				details: { title: "O Kit Inclui", items: ["1x Caneca", "1x Tirante"] },
				active: true,
				position: 6,
			}),
			product({
				id: "9",
				categoryId: "combos",
				name: "Caneca + Tirante + Pin",
				description:
					"Kit com Caneca, tirante e pin para máxima capacidade e praticidade.",
				priceInCents: 4200,
				images: [
					"/kit/kit1.png",
					"/produtos/caneca.jpg",
					"/produtos/pin.png",
					"/produtos/tirante.jpg",
				],
				sizes: [],
				details: {
					title: "O Kit Inclui",
					items: ["1x Caneca", "1x Tirante", "1x Pin"],
				},
				active: true,
				position: 7,
			}),
			product({
				id: "10",
				categoryId: "combos",
				name: "Camiseta + Caneca + Tirante + Pin",
				description: "Kit com Camiseta rosa ou preta, Caneca, tirante e pin.",
				priceInCents: 8990,
				images: [
					"/kit/kit-completo.jpeg",
					"/produtos/caneca.jpg",
					"/produtos/tirante.jpg",
					"/produtos/pin.png",
					"/produtos/camisetas/camiseta-rosa.png",
					"/produtos/camisetas/camiseta-preta.png",
				],
				sizes: SIZES,
				details: {
					title: "O Kit Inclui",
					items: [
						"1x Camiseta Rosa ou Preta",
						"1x Caneca",
						"1x Tirante",
						"1x Pin",
					],
				},
				active: true,
				position: 8,
			}),
		],
	};
}

/** Keeps only known fields (files saved by older versions may have extra ones). */
export function normalizeCatalog(raw: unknown): CatalogData {
	const data = (raw ?? {}) as Partial<Record<keyof CatalogData, Record<string, unknown>[]>>;
	return {
		categories: (data.categories ?? []).map((item, index) => ({
			id: String(item.id),
			name: String(item.name),
			position: typeof item.position === "number" ? item.position : index,
			createdAt: String(item.createdAt ?? SEEDED_AT),
			updatedAt: String(item.updatedAt ?? SEEDED_AT),
		})),
		products: (data.products ?? []).map((item, index) => ({
			id: String(item.id),
			categoryId: String(item.categoryId),
			name: String(item.name),
			description: String(item.description ?? ""),
			priceInCents: Number(item.priceInCents),
			images: (item.images as string[]) ?? [],
			sizes: (item.sizes as string[]) ?? [],
			details: (item.details as Product["details"]) ?? { title: "", items: [] },
			active: item.active !== false,
			position: typeof item.position === "number" ? item.position : index,
			createdAt: String(item.createdAt ?? SEEDED_AT),
			updatedAt: String(item.updatedAt ?? SEEDED_AT),
		})),
	};
}
