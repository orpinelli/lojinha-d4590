/**
 * WhatsApp numbers are stored as digits only, with the country code
 * (5519991666588). How the admin types them doesn't matter: "+55 19 99166-6588",
 * "(19) 99166-6588" and "55 19 991666588" are all the same number.
 */

const BRAZIL = "55";

/** Area code (two digits, no zero) + mobile (9 + 8 digits) or landline (2–5 + 7 digits). */
const BRAZILIAN_NATIONAL = /^[1-9]{2}(9\d{8}|[2-5]\d{7})$/;

export function onlyDigits(value: string): string {
	return value.replace(/\D/g, "");
}

/**
 * Keeps only the digits. A complete Brazilian number typed without the
 * country code (area code + number) gets the 55 in front.
 */
export function normalizeWhatsapp(value: string): string {
	const digits = onlyDigits(value);
	return BRAZILIAN_NATIONAL.test(digits) ? BRAZIL + digits : digits;
}

/** Splits the subscriber number: 9 digits (mobile) → 99166-6588, 8 (landline) → 3333-4444. */
function formatSubscriber(digits: string): string {
	const cut = digits.length > 8 ? 5 : 4;
	return digits.length > cut ? `${digits.slice(0, cut)}-${digits.slice(cut)}` : digits;
}

/**
 * Display only — never stored. Works on partial input, so it can format while typing:
 * 5519991666588 → "+55 19 99166-6588"; 19991666588 → "19 99166-6588" (55 is added on save).
 */
export function formatWhatsapp(value: string): string {
	const digits = onlyDigits(value).slice(0, 15);
	if (!digits) return "";

	if (digits.startsWith(BRAZIL)) {
		const areaCode = digits.slice(2, 4);
		const subscriber = digits.slice(4);
		return [`+${BRAZIL}`, areaCode, subscriber && formatSubscriber(subscriber)].filter(Boolean).join(" ");
	}
	// Brazilian number still without the country code (area code first)
	if (digits.length <= 11) {
		const areaCode = digits.slice(0, 2);
		const subscriber = digits.slice(2);
		return [areaCode, subscriber && formatSubscriber(subscriber)].filter(Boolean).join(" ");
	}
	// Another country: keep the digits, just mark it as international
	return `+${digits}`;
}

/** While typing: a Brazilian number never has more than 13 digits (55 + area code + 9); others up to 15. */
export function limitWhatsappDigits(digits: string): string {
	return digits.slice(0, digits.startsWith(BRAZIL) ? 13 : 15);
}

/**
 * Checks a normalized number. Brazil: 55 + area code + mobile/landline, which also
 * catches a missing or extra digit. Other countries: country code + number (12–15 digits).
 */
export function isValidWhatsapp(digits: string): boolean {
	if (digits.startsWith(BRAZIL)) return BRAZILIAN_NATIONAL.test(digits.slice(BRAZIL.length));
	return /^\d{12,15}$/.test(digits);
}
