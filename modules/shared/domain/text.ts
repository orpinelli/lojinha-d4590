/** "Kits/Combos Ação" -> "kits-combos-acao" (used for section anchors). */
export function slugify(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
