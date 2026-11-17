import type { StoreProduct } from "@/modules/catalog/domain/product";
import { Carousel } from "./carousel";
import { CatalogProductCard } from "./product-card";

/**
 * Same card widths as the grid. Fractional values show a peek of the next card
 * on phones and tablets (hints at swiping).
 */
const CAROUSEL_BREAKPOINTS = {
	640: { slidesPerView: 3.2, spaceBetween: 16 },
	768: { slidesPerView: 4.2, spaceBetween: 16 },
	1024: { slidesPerView: 5, spaceBetween: 20 },
	1280: { slidesPerView: 6, spaceBetween: 20 },
	1536: { slidesPerView: 7, spaceBetween: 20 },
};

export function ProductCollection({
	products,
	layout,
}: {
	products: StoreProduct[];
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
					slidesPerView={2.2}
					spaceBetween={12}
					breakpoints={CAROUSEL_BREAKPOINTS}
					className="!pt-1 !pb-10"
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
		// Cards about 170–200px wide on every screen: 2 per row on phones up to 7 on wide
		// desktops, so a whole section fits on screen.
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-6 2xl:grid-cols-7">
			{cards}
		</div>
	);
}
