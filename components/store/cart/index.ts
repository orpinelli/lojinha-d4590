import {
	CartCustomer,
	CartEmpty,
	CartHeader,
	CartLines,
	CartLoading,
	CartPayment,
	CartPlaced,
	CartReview,
	CartRoot,
	CartStep,
	CartStepper,
	CartSteps,
	CartSummary,
} from "./cart";

/**
 * Cart page (/carrinho), by composition:
 *
 * <Cart.Root>
 *   <Cart.Header />
 *   <Cart.Loading />
 *   <Cart.Empty />
 *   <Cart.Review>
 *     <Cart.Steps>                       (one step at a time, in the order of ./steps.ts)
 *       <Cart.Stepper />                  (progress: Produtos — Seus dados — Pagamento)
 *       <Cart.Step step="produtos"><Cart.Lines /></Cart.Step>
 *       <Cart.Step step="dados"><Cart.Customer /></Cart.Step>
 *       <Cart.Step step="pagamento"><Cart.Payment /></Cart.Step>
 *     </Cart.Steps>
 *     <Cart.Summary />                    (sticky on every step: totals + the step's buttons)
 *   </Cart.Review>
 *   <Cart.Placed />
 * </Cart.Root>
 */
export const Cart = {
	Root: CartRoot,
	Header: CartHeader,
	Loading: CartLoading,
	Empty: CartEmpty,
	Review: CartReview,
	Steps: CartSteps,
	Stepper: CartStepper,
	Step: CartStep,
	Lines: CartLines,
	Customer: CartCustomer,
	Payment: CartPayment,
	Summary: CartSummary,
	Placed: CartPlaced,
};
