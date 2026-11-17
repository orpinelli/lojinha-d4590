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
 *     <Cart.Lines />
 *     <Cart.Summary>
 *       <Cart.Payment />
 *       <Cart.Customer />
 *     </Cart.Summary>
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
	Lines: CartLines,
	Summary: CartSummary,
	Payment: CartPayment,
	Customer: CartCustomer,
	Placed: CartPlaced,
};
