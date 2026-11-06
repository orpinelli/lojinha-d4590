import type { Product } from "@/modules/catalog/domain/product";
import { ProductCard } from "./parts";

/** Grid/carousel card: same parts, compact layout. */
export function CatalogProductCard({ product }: { product: Product }) {
	return (
		<ProductCard.Root product={product} className="h-full">
			<ProductCard.Media />
			<ProductCard.Body>
				<ProductCard.Title className="line-clamp-2 text-base leading-snug" />
				<ProductCard.Description className="line-clamp-2 text-[13px] leading-normal" />
				<ProductCard.Price className="mt-auto pt-1 text-xl text-foreground" />
			</ProductCard.Body>
			<ProductCard.Footer>
				<ProductCard.SizePicker triggerClassName="h-10 text-sm" placeholder="Tamanho" />
				<ProductCard.AddButton>Adicionar</ProductCard.AddButton>
			</ProductCard.Footer>
		</ProductCard.Root>
	);
}

/** Highlight card: same parts, editorial layout; `badge` is the showcase title. */
export function FeaturedProductCard({
	product,
	badge,
	priority,
}: {
	product: Product;
	badge?: string;
	priority?: boolean;
}) {
	return (
		<ProductCard.Root product={product} className="mx-auto w-full max-w-6xl hover:translate-y-0">
			<div className="grid grid-cols-1 md:grid-cols-2">
				<ProductCard.Media
					linked={false}
					priority={priority}
					sizes="(max-width: 768px) 100vw, 50vw"
					className="md:h-full"
				/>
				<div className="flex min-w-0 flex-col justify-center gap-4 border-t-2 p-6 sm:p-8 md:border-t-0 md:border-l-2 lg:p-12">
					<ProductCard.FeaturedBadge label={badge} className="self-start" />
					<ProductCard.Title
						linked={false}
						className="font-display text-3xl leading-tight font-semibold md:text-4xl"
					/>
					<ProductCard.Description className="text-base leading-relaxed md:text-[17px]" />
					<div className="flex flex-wrap items-center gap-3">
						<ProductCard.Price className="text-4xl font-semibold text-primary" />
						<ProductCard.ShippingBadge />
					</div>
					<ProductCard.SizePicker placeholder="Selecione o tamanho" />
					{/* Side by side only when both fit (min ~13rem each); stacked otherwise. */}
					<div className="flex flex-wrap gap-3 pt-1 pb-1 *:min-w-52 *:flex-1">
						<ProductCard.AddButton size="md">Adicionar ao carrinho</ProductCard.AddButton>
						<ProductCard.DetailsLink />
					</div>
				</div>
			</div>
		</ProductCard.Root>
	);
}
