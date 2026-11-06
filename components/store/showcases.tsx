import type { Product } from "@/modules/catalog/domain/product";
import type { ShowcaseLayout } from "@/modules/showcase/domain/showcase";
import { Carousel } from "./carousel";
import { FeaturedProductCard } from "./product-card";
import { ProductCollection } from "./product-collection";
import { ShowcaseSection } from "./sections";

const countLabel = (count: number) => `${count} produto${count === 1 ? "" : "s"}`;

/** "Destaque" format: large cards; the showcase title becomes the seal. */
export function FeaturedShowcase({
	title,
	products,
	priority,
}: {
	title: string;
	products: Product[];
	priority?: boolean;
}) {
	return (
		<section className="px-4 pt-2 pb-8 sm:px-6 sm:pb-12 lg:px-10" aria-label={title}>
			<div className="mx-auto w-full max-w-[1440px]">
				{products.length === 1 ? (
					<FeaturedProductCard product={products[0]} badge={title} priority={priority} />
				) : (
					<Carousel.Root>
						<Carousel.Viewport loop autoplayDelay={4500} pagination className="pt-1 pb-10">
							{products.map((product, index) => (
								<FeaturedProductCard
									key={product.id}
									product={product}
									badge={title}
									priority={priority && index === 0}
								/>
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

/** "Carrossel" and "Grade" formats: titled section with standard cards. */
export function ShowcaseBlock({
	anchor,
	title,
	layout,
	products,
}: {
	anchor: string;
	title: string;
	layout: Exclude<ShowcaseLayout, "featured">;
	products: Product[];
}) {
	return (
		<ShowcaseSection.Root id={anchor}>
			<ShowcaseSection.Header>
				<ShowcaseSection.Label>{countLabel(products.length)}</ShowcaseSection.Label>
				<ShowcaseSection.Title>{title}</ShowcaseSection.Title>
			</ShowcaseSection.Header>
			<ProductCollection layout={layout} products={products} />
		</ShowcaseSection.Root>
	);
}
