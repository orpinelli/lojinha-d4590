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

const yearMonthFormat = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "numeric",
	timeZone: "America/Sao_Paulo",
});

/** Year and month (1–12) in Brasília time, or null for an invalid date. */
export function brazilYearMonth(iso: string): { year: number; month: number } | null {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	const parts = yearMonthFormat.formatToParts(date);
	const part = (type: "year" | "month") => Number(parts.find((item) => item.type === type)?.value);
	return { year: part("year"), month: part("month") };
}
