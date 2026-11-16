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
