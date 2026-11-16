/** The server runs in UTC: dates are always shown in Brasília time. */
const dateTime = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "short",
	timeStyle: "short",
	timeZone: "America/Sao_Paulo",
});

/** "16/11/2026, 09:40" ("" for an invalid date). */
export function formatDateTime(iso: string): string {
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? "" : dateTime.format(date);
}

const yearFormat = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/Sao_Paulo" });

/** Year in Brasília time: an order at 22:00 on Dec 31 belongs to that year, not the next one. */
export function yearInBrazil(iso: string): number {
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? Number.NaN : Number(yearFormat.format(date));
}
