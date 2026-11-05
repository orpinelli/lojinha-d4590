import "server-only";
import { randomUUID } from "node:crypto";
import { createJsonFileStore } from "@/modules/shared/infrastructure/json-file-store";
import type { Showcase, ShowcaseRepository } from "../domain/showcase";
import { showcaseSeed } from "./showcase-seed";

/** File-backed adapter used in local development (`DATA_PROVIDER=local`). */
export function createLocalShowcaseRepository(filePath: string): ShowcaseRepository {
	const store = createJsonFileStore<Showcase[]>({ filePath, seed: showcaseSeed });
	const now = () => new Date().toISOString();
	const find = async (id: string) => (await store.read()).find((item) => item.id === id);

	return {
		async list() {
			return (await store.read()).sort((a, b) => a.position - b.position);
		},
		findById: async (id) => (await find(id)) ?? null,
		create(input, position) {
			return store.update((items) => {
				const timestamp = now();
				const created: Showcase = {
					...input,
					id: randomUUID(),
					position,
					createdAt: timestamp,
					updatedAt: timestamp,
				};
				items.push(created);
				return created;
			});
		},
		async update(id, input) {
			if (!(await find(id))) return null;
			return store.update((items) => {
				const index = items.findIndex((item) => item.id === id);
				if (index < 0) return null;
				items[index] = { ...items[index], ...input, id, updatedAt: now() };
				return items[index];
			});
		},
		async delete(id) {
			if (!(await find(id))) return false;
			return store.update((items) => {
				const index = items.findIndex((item) => item.id === id);
				if (index < 0) return false;
				items.splice(index, 1);
				return true;
			});
		},
		async reorder(ids) {
			await store.update((items) => {
				const rank = new Map(ids.map((id, index) => [id, index]));
				for (const item of items) {
					const position = rank.get(item.id);
					if (position !== undefined) item.position = position;
				}
			});
		},
	};
}
