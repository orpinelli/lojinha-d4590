import "server-only";
import { randomUUID } from "node:crypto";
import { createJsonFileStore } from "@/modules/shared/infrastructure/json-file-store";
import { byPositionThenName, type Category, type Product } from "../domain/product";
import type { CatalogRepositories } from "../domain/repositories";
import { catalogSeed, normalizeCatalog, type CatalogData } from "./catalog-seed";

type Collection = keyof CatalogData;
type Entity<K extends Collection> = CatalogData[K][number];
type Input<K extends Collection> = Omit<Entity<K>, "id" | "position" | "createdAt" | "updatedAt">;

/** File-backed adapter used in local development (`DATA_PROVIDER=local`). */
export function createLocalCatalogRepositories(filePath: string): CatalogRepositories {
	const store = createJsonFileStore<CatalogData>({
		filePath,
		seed: catalogSeed,
		normalize: normalizeCatalog,
	});
	const now = () => new Date().toISOString();

	async function find<K extends Collection>(collection: K, id: string) {
		const data = await store.read();
		return (data[collection] as Entity<K>[]).find((item) => item.id === id);
	}

	function insert<K extends Collection>(collection: K, input: Input<K>, position: number) {
		return store.update((data) => {
			const timestamp = now();
			const entity = {
				...input,
				id: randomUUID(),
				position,
				createdAt: timestamp,
				updatedAt: timestamp,
			} as Entity<K>;
			(data[collection] as Entity<K>[]).push(entity);
			return entity;
		});
	}

	async function replace<K extends Collection>(collection: K, id: string, input: Input<K>) {
		if (!(await find(collection, id))) return null;
		return store.update((data) => {
			const items = data[collection] as Entity<K>[];
			const index = items.findIndex((item) => item.id === id);
			if (index < 0) return null;
			const updated = { ...items[index], ...input, id, updatedAt: now() } as Entity<K>;
			items[index] = updated;
			return updated;
		});
	}

	async function remove(collection: Collection, id: string) {
		if (!(await find(collection, id))) return false;
		return store.update((data) => {
			const items = data[collection] as { id: string }[];
			const index = items.findIndex((item) => item.id === id);
			if (index < 0) return false;
			items.splice(index, 1);
			return true;
		});
	}

	return {
		products: {
			async list(filter) {
				const { products } = await store.read();
				return products
					.filter((product) => !filter?.onlyActive || product.active)
					.sort(byPositionThenName);
			},
			findById: async (id) => (await find("products", id)) ?? null,
			create: (input, position) => insert("products", input, position) as Promise<Product>,
			update: (id, input) => replace("products", id, input) as Promise<Product | null>,
			delete: (id) => remove("products", id),
			async countByCategory() {
				const { products } = await store.read();
				const counts: Record<string, number> = {};
				for (const product of products) {
					counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
				}
				return counts;
			},
		},

		categories: {
			async list() {
				const { categories } = await store.read();
				return [...categories].sort(byPositionThenName);
			},
			findById: async (id) => (await find("categories", id)) ?? null,
			create: (input, position) => insert("categories", input, position) as Promise<Category>,
			update: (id, input) => replace("categories", id, input) as Promise<Category | null>,
			delete: (id) => remove("categories", id),
			async reorder(ids) {
				await store.update((data) => {
					const rank = new Map(ids.map((id, index) => [id, index]));
					for (const category of data.categories) {
						const position = rank.get(category.id);
						if (position !== undefined) category.position = position;
					}
				});
			},
		},
	};
}
