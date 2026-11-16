/** Lowercase, without accents: "João" and "joao" are the same for searching. */
export function normalizeSearchText(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.trim();
}

/** Only digits and phone punctuation, e.g. "(19) 99999-8888" or "+55 19". */
const PHONE_LIKE = /^[\d\s()+.-]+$/;

/**
 * True when what was typed is found in the terms (name, order code, phone...).
 * - Words: every word must appear; "#" in front is ignored ("#k7p" finds K7P2QX).
 * - Numbers typed like a phone: compared digit by digit, ignoring formatting
 *   ("(19) 99999-8888" finds 5519999998888), within one term at a time.
 * An empty query matches everything.
 */
export function matchesSearch(query: string, terms: string[]): boolean {
	const typed = query.trim();
	if (!typed) return true;
	const texts = terms.map(normalizeSearchText);

	if (PHONE_LIKE.test(typed)) {
		const digits = typed.replace(/\D/g, "");
		return terms.some((term) => term.replace(/\D/g, "").includes(digits)) || texts.some((text) => text.includes(digits));
	}

	const text = texts.join(" ");
	return normalizeSearchText(typed)
		.split(/\s+/)
		.every((raw) => {
			const word = raw.replace(/^#+/, "");
			return !word || text.includes(word);
		});
}
