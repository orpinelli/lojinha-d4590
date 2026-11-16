/// <reference types="vitest/globals" />
import { formatDateTime } from "./dates";

describe("dates", () => {
	it("shows Brasília time even though the server runs in UTC", () => {
		const text = formatDateTime("2026-11-16T12:40:00.000Z");
		expect(text).toContain("16/11/2026");
		expect(text).toContain("09:40");
	});

	it("returns an empty text for invalid dates", () => {
		expect(formatDateTime("ontem")).toBe("");
	});
});
