import type { Product } from "@/modules/catalog/domain/product";
import { Carousel } from "./carousel";
import { CatalogProductCard } from "./product-card";

const CAROUSEL_BREAKPOINTS = {
	480: { slidesPerView: 2, spaceBetween: 16 },
	768: { slidesPerView: 3, spaceBetween: 20 },
	1024: { slidesPerView: 4, spaceBetween: 24 },
};

/** Up to 4 products: responsive grid. More than 4: carousel. */
export function ProductCollection({ products }: { products: Product[] }) {
	const cards = products.map((product) => (
		<CatalogProductCard key={product.id} product={product} />
	));

	if (products.length > 4) {
		return (
			<Carousel.Root>
				<Carousel.Viewport
					pagination
					breakpoints={CAROUSEL_BREAKPOINTS}
					className="pb-10"
					slideClassName="!h-auto"
				>
					{cards}
				</Carousel.Viewport>
				<Carousel.Previous />
				<Carousel.Next />
			</Carousel.Root>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
			{cards}
		</div>
	);
}
