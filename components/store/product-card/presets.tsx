import type { StoreProduct } from "@/modules/catalog/domain/product";
import { ProductCard } from "./parts";

/**
 * Grid/carousel card: same parts, compact layout (name and price only; the
 * description is on the product page). Slightly wide photo, since product
 * shots are mostly wide, with a 16px margin so photos never touch the border.
 */
export function CatalogProductCard({ product }: { product: StoreProduct }) {
	return (
		<ProductCard.Root product={product} className="h-full">
			<ProductCard.Media
				className="aspect-[5/4]"
				imageClassName="p-4"
				sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
			/>
			<ProductCard.Body className="gap-1 px-3 pt-2 pb-3">
				<ProductCard.Title className="line-clamp-2 text-sm leading-snug" />
				<ProductCard.Price className="mt-auto pt-1 text-lg text-foreground" />
			</ProductCard.Body>
			<ProductCard.Footer className="gap-2 p-3">
				<ProductCard.SizePicker triggerClassName="h-9 text-[13px]" placeholder="Tamanho" />
				<ProductCard.AddButton>Adicionar</ProductCard.AddButton>
			</ProductCard.Footer>
		</ProductCard.Root>
	);
}

/**
 * Highlight card (first screen of the home): photo + name, price and the buy
 * button, all visible at once on a phone. Photo and name open the product;
 * `badge` is the showcase title.
 */
export function FeaturedProductCard({
	product,
	badge,
	priority,
}: {
	product: StoreProduct;
	badge?: string;
	priority?: boolean;
}) {
	return (
		<ProductCard.Root
			product={product}
			className="mx-auto w-full max-w-5xl hover:translate-y-0 hover:shadow-none"
		>
			<div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
				{/* Wide on phones (room for the details below); fills the row height beside them on desktop. */}
				<ProductCard.Media
					priority={priority}
					sizes="(max-width: 768px) 100vw, 540px"
					className="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[400px]"
					imageClassName="p-4 sm:p-6"
				/>
				<div className="flex min-w-0 flex-col justify-center gap-2.5 border-t-2 p-5 sm:p-7 md:border-t-0 md:border-l-2 lg:p-10">
					<ProductCard.FeaturedBadge label={badge} className="self-start" />
					<ProductCard.Title className="font-display text-xl leading-snug font-semibold sm:text-2xl lg:text-[28px]" />
					<ProductCard.Price className="text-2xl font-semibold text-primary sm:text-[28px]" />
					<div className="mt-2 flex w-full flex-col gap-3 pb-1 md:max-w-sm">
						<ProductCard.SizePicker placeholder="Selecione o tamanho" />
						<ProductCard.AddButton size="md">Adicionar ao carrinho</ProductCard.AddButton>
						<ProductCard.DetailsLink variant="link" className="self-center md:self-start">
							Ver detalhes do produto
						</ProductCard.DetailsLink>
					</div>
				</div>
			</div>
		</ProductCard.Root>
	);
}
