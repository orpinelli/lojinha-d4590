import { CartFooter, CartHeader, CartItems, CartSheet } from "./cart";

export const Cart = {
	Sheet: CartSheet,
	Header: CartHeader,
	Items: CartItems,
	Footer: CartFooter,
};

/** Default composition used by the storefront layout. */
export function CartSidebar() {
	return (
		<Cart.Sheet>
			<Cart.Header />
			<Cart.Items />
			<Cart.Footer />
		</Cart.Sheet>
	);
}
