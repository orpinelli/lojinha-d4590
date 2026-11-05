import { z } from "zod";
import { ValidationError } from "./errors";

/** Body of every "reorder" endpoint: the complete list of ids, in the new order. */
export const reorderSchema = z.object({
	ids: z
		.array(z.string().trim().min(1))
		.min(1, "Lista vazia.")
		.max(500, "Lista grande demais.")
		.refine((ids) => new Set(ids).size === ids.length, "Há itens repetidos."),
});

/** New items go to the end of the list. */
export function nextPosition(items: { position: number }[]): number {
	return items.reduce((max, item) => Math.max(max, item.position), -1) + 1;
}

/** A reorder must contain exactly the current items (no more, no less). */
export function assertSameItems(ids: string[], currentIds: string[]): void {
	const current = new Set(currentIds);
	if (ids.length !== current.size || ids.some((id) => !current.has(id))) {
		throw new ValidationError("A lista mudou enquanto você editava. Recarregue a página.");
	}
}
