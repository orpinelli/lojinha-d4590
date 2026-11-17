import {
	CartCustomer,
	CartEmpty,
	CartHeader,
	CartItems,
	CartLines,
	CartLoading,
	CartPayment,
	CartPlaced,
	CartReview,
	CartRoot,
	CartSections,
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
 *     <Cart.Sections>            (drawers that open and close)
 *       <Cart.Items>
 *         <Cart.Lines />
 *       </Cart.Items>
 *       <Cart.Payment />
 *       <Cart.Customer />
 *     </Cart.Sections>
 *     <Cart.Summary />            (sticky: totals + finish button)
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
	Sections: CartSections,
	Items: CartItems,
	Lines: CartLines,
	Summary: CartSummary,
	Payment: CartPayment,
	Customer: CartCustomer,
	Placed: CartPlaced,
};
