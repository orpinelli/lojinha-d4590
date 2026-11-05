import type { Product } from "@/modules/catalog/domain/product";
import { Carousel } from "./carousel";
import { FeaturedProductCard } from "./product-card";

export function FeaturedProducts({ products }: { products: Product[] }) {
	if (products.length === 0) return null;

	return (
		<section className="px-4 pb-6 sm:px-6 sm:pb-10" aria-label="Destaques">
			<div className="mx-auto w-full max-w-7xl">
				{products.length === 1 ? (
					<FeaturedProductCard product={products[0]} priority />
				) : (
					<Carousel.Root>
						<Carousel.Viewport loop autoplayDelay={4500} pagination className="pb-10">
							{products.map((product, index) => (
								<FeaturedProductCard key={product.id} product={product} priority={index === 0} />
							))}
						</Carousel.Viewport>
						<Carousel.Previous />
						<Carousel.Next />
					</Carousel.Root>
				)}
			</div>
		</section>
	);
}
