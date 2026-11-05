"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminMutation } from "./use-admin-mutation";

/**
 * Optimistic drag-and-drop ordering for server lists: updates the screen
 * immediately, saves, and rolls back if the server refuses.
 */
export function useReorder<T extends { id: string }>(
	items: T[],
	save: (ids: string[]) => Promise<unknown>,
) {
	const [ordered, setOrdered] = useState(items);
	const mutate = useAdminMutation();

	// Server data changed (e.g. after router.refresh): follow it.
	useEffect(() => setOrdered(items), [items]);

	const reorder = useCallback(
		async (ids: string[]) => {
			const previous = ordered;
			const byId = new Map(ordered.map((item) => [item.id, item]));
			setOrdered(ids.flatMap((id) => byId.get(id) ?? []));
			const { ok } = await mutate(() => save(ids), { successMessage: "Ordem salva." });
			if (!ok) setOrdered(previous);
		},
		[ordered, mutate, save],
	);

	return { items: ordered, reorder };
}
