import type { Metadata } from "next";
import { Cart } from "@/components/store/cart";
import { SiteHeader } from "@/components/store/site-header";

export const metadata: Metadata = {
	title: "Carrinho",
	robots: { index: false },
};

/** Checkout in three steps (products, details, payment) before sending the order. */
export default function CartPage() {
	return (
		<div className="min-h-screen bg-background">
			<SiteHeader.Root position="sticky">
				<SiteHeader.Bar>
					<SiteHeader.BackButton />
					<SiteHeader.Brand />
					<SiteHeader.CartButton />
				</SiteHeader.Bar>
			</SiteHeader.Root>

			<main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
				<Cart.Root>
					<Cart.Header />
					<Cart.Loading />
					<Cart.Empty />
					<Cart.Review>
						<Cart.Steps>
							<Cart.Stepper />
							<Cart.Step step="produtos">
								<Cart.Lines />
							</Cart.Step>
							<Cart.Step step="dados">
								<Cart.Customer />
							</Cart.Step>
							<Cart.Step step="pagamento">
								<Cart.Payment />
							</Cart.Step>
						</Cart.Steps>
						<Cart.Summary />
					</Cart.Review>
					<Cart.Placed />
				</Cart.Root>
			</main>
		</div>
	);
}
