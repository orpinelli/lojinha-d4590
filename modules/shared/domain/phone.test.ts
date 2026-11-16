/// <reference types="vitest/globals" />
import { formatWhatsapp, isValidWhatsapp, limitWhatsappDigits, normalizeWhatsapp } from "./phone";
import { whatsappChatUrl, whatsappMessageUrl } from "./whatsapp";

describe("phone", () => {
	it("stores any typing style as digits with the country code", () => {
		expect(normalizeWhatsapp("+55 19 99166-6588")).toBe("5519991666588");
		expect(normalizeWhatsapp("(19) 99166-6588")).toBe("5519991666588");
		expect(normalizeWhatsapp("19 3333-4444")).toBe("551933334444");
		expect(normalizeWhatsapp("+1 415 555 0100")).toBe("14155550100");
	});

	it("formats for display, also while typing", () => {
		expect(formatWhatsapp("5519991666588")).toBe("+55 19 99166-6588");
		expect(formatWhatsapp("19991666588")).toBe("19 99166-6588");
		expect(formatWhatsapp("551")).toBe("+55 1");
		expect(formatWhatsapp("")).toBe("");
	});

	it("validates Brazilian and international numbers", () => {
		expect(isValidWhatsapp("5519991666588")).toBe(true);
		expect(isValidWhatsapp("551933334444")).toBe(true);
		expect(isValidWhatsapp("551999166658")).toBe(false); // one digit missing
		expect(isValidWhatsapp("5509991666588")).toBe(false); // invalid area code
		expect(isValidWhatsapp("447911123456")).toBe(true);
	});

	it("limits the digits while typing", () => {
		expect(limitWhatsappDigits("55199916665881234")).toBe("5519991666588");
		expect(limitWhatsappDigits("4479111234567890")).toBe("447911123456789");
	});
});

describe("whatsapp links", () => {
	it("opens a chat with the normalized number", () => {
		expect(whatsappChatUrl("(19) 99166-6588")).toBe("https://wa.me/5519991666588");
	});

	it("pre-fills an encoded message", () => {
		expect(whatsappMessageUrl("5519991666588", "Olá! 2x Pin & Caneca")).toBe(
			"https://wa.me/5519991666588?text=Ol%C3%A1!%202x%20Pin%20%26%20Caneca",
		);
	});
});
