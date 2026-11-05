import type { Product } from "@/modules/catalog/domain/product";
import { ProductCard } from "./parts";

/** Grid/carousel card: same parts, compact layout. */
export function CatalogProductCard({ product }: { product: Product }) {
	return (
		<ProductCard.Root product={product} className="h-full hover:shadow-lg">
			<div className="flex h-full flex-col">
				<ProductCard.Media />
				<ProductCard.Body>
					<div>
						<ProductCard.Title className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm leading-tight font-normal hover:text-primary sm:text-[0.95rem]" />
						<ProductCard.Price className="mb-4 block text-lg font-normal sm:text-xl" />
					</div>
					<ProductCard.SizePicker className="mb-3" triggerClassName="h-10 text-xs" placeholder="Tamanho" />
					<ProductCard.AddButton className="py-2 text-xs font-normal sm:text-[13px]">
						Adicionar
					</ProductCard.AddButton>
				</ProductCard.Body>
			</div>
		</ProductCard.Root>
	);
}

/** "Mais vendido" highlight: same parts, editorial layout. */
export function FeaturedProductCard({
	product,
	priority,
}: {
	product: Product;
	priority?: boolean;
}) {
	return (
		<ProductCard.Root
			product={product}
			className="mx-auto w-full max-w-6xl shadow-lg duration-500 hover:shadow-2xl"
		>
			<div className="grid grid-cols-1 md:grid-cols-2">
				<ProductCard.Media
					linked={false}
					priority={priority}
					sizes="(max-width: 768px) 100vw, 50vw"
					imageClassName="duration-700"
				/>
				<div className="relative flex min-w-0 flex-col justify-center bg-background p-6 sm:p-8 md:p-10 lg:p-12">
					<ProductCard.FeaturedBadge className="absolute -top-3 left-4 sm:left-8" />
					<ProductCard.Title
						linked={false}
						className="mb-4 text-2xl font-light tracking-tight md:mb-6 md:text-3xl lg:text-4xl"
					/>
					<ProductCard.Description className="mb-6 text-sm leading-relaxed sm:text-base md:mb-8 md:text-[1.05rem]" />
					<div className="mb-6 flex flex-wrap items-center gap-4 sm:gap-6 md:mb-8">
						<ProductCard.Price className="text-3xl font-light md:text-4xl" />
						<ProductCard.ShippingBadge />
					</div>
					<ProductCard.SizePicker
						className="mb-4 md:mb-6"
						triggerClassName="h-10 md:h-11"
						placeholder="Selecione o tamanho"
					/>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
						<ProductCard.DetailsLink />
						<ProductCard.AddButton className="text-sm font-light">Adicionar ao Carrinho</ProductCard.AddButton>
					</div>
				</div>
			</div>
		</ProductCard.Root>
	);
}
