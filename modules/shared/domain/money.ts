const brl = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

/** Prices are stored as integer cents to avoid floating point drift. */
export function formatPrice(cents: number): string {
	return brl.format(cents / 100);
}
