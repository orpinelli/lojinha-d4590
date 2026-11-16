/// <reference types="vitest/globals" />
import { matchesSearch, normalizeSearchText } from "./search";

describe("search", () => {
	const order = ["K7P2QX", "João da Silva", "5519999998888"];

	it("ignores case and accents", () => {
		expect(normalizeSearchText("  JOÃO Ação ")).toBe("joao acao");
		expect(matchesSearch("joao", order)).toBe(true);
		expect(matchesSearch("SILVA", order)).toBe(true);
	});

	it("finds the order code with or without #, even partially", () => {
		expect(matchesSearch("k7p2qx", order)).toBe(true);
		expect(matchesSearch("#K7P", order)).toBe(true);
		expect(matchesSearch("#ZZZ", order)).toBe(false);
	});

	it("finds the phone in any typing style", () => {
		expect(matchesSearch("99999-8888", order)).toBe(true);
		expect(matchesSearch("(19) 99999", order)).toBe(true);
	});

	it("needs every word typed", () => {
		expect(matchesSearch("joao silva", order)).toBe(true);
		expect(matchesSearch("joao pereira", order)).toBe(false);
	});

	it("matches everything when the query is empty", () => {
		expect(matchesSearch("   ", order)).toBe(true);
	});
});
