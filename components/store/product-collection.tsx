import type { Product } from "@/modules/catalog/domain/product";
import { Carousel } from "./carousel";
import { CatalogProductCard } from "./product-card";

/** Fractional values show a peek of the next card on phones (hints at swiping). */
const CAROUSEL_BREAKPOINTS = {
	480: { slidesPerView: 2.2, spaceBetween: 16 },
	768: { slidesPerView: 3, spaceBetween: 20 },
	1024: { slidesPerView: 4, spaceBetween: 24 },
};

export function ProductCollection({
	products,
	layout,
}: {
	products: Product[];
	layout: "carousel" | "grid";
}) {
	const cards = products.map((product) => (
		<CatalogProductCard key={product.id} product={product} />
	));

	if (layout === "carousel") {
		return (
			<Carousel.Root>
				<Carousel.Viewport
					pagination
					slidesPerView={1.2}
					breakpoints={CAROUSEL_BREAKPOINTS}
					className="pt-1 pb-12"
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
