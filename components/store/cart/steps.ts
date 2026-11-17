/*
 * The checkout steps of /carrinho, in order. The current step lives in the URL
 * (/carrinho, ?etapa=dados, ?etapa=pagamento), so the browser back button (or
 * the back gesture on the phone) goes to the previous step and a reload keeps it.
 */

export const CART_STEP_PARAM = "etapa";

export type CartStepId = "produtos" | "dados" | "pagamento";

export type CartStepDefinition = {
	id: CartStepId;
	/** Short name in the progress bar. */
	label: string;
	title: string;
	description: string;
	optional?: boolean;
	/** Label of the button that goes to the next step (the last step finishes instead). */
	next?: string;
};

export const CART_STEPS: readonly CartStepDefinition[] = [
	{
		id: "produtos",
		label: "Produtos",
		title: "Confira seus produtos",
		description: "Altere a quantidade ou remova o que não quiser antes de seguir.",
		next: "Continuar para seus dados",
	},
	{
		id: "dados",
		label: "Seus dados",
		title: "Seus dados",
		optional: true,
		description: "Ajuda a loja a saber de quem é o pedido. Fica salvo neste aparelho para o próximo.",
		next: "Continuar para o pagamento",
	},
	{
		id: "pagamento",
		label: "Pagamento",
		title: "Forma de pagamento",
		description: "Escolha como vai pagar. O pagamento é combinado com a loja pelo WhatsApp.",
	},
];

/** Unknown or missing values fall back to the first step. */
export function parseCartStep(value: string | null | undefined): CartStepId {
	return CART_STEPS.find((step) => step.id === value)?.id ?? CART_STEPS[0].id;
}

export function cartStepIndex(step: CartStepId): number {
	return CART_STEPS.findIndex((item) => item.id === step);
}

/** Query string of a step (the first step has none), keeping any other parameter. */
export function cartStepSearch(step: CartStepId, search: string): string {
	const params = new URLSearchParams(search);
	if (step === CART_STEPS[0].id) params.delete(CART_STEP_PARAM);
	else params.set(CART_STEP_PARAM, step);
	const query = params.toString();
	return query ? `?${query}` : "";
}
