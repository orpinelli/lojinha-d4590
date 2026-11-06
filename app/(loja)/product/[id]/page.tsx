import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Price } from "@/components/store/price";
import { ProductDetails } from "@/components/store/product-details";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchase } from "@/components/store/product-purchase";
import { SiteHeader } from "@/components/store/site-header";
import { ShippingBadge } from "@/components/store/store-badges";
import { Badge } from "@/components/ui/badge";
import { getPublicProduct } from "@/lib/server/queries";
import { productCover } from "@/modules/catalog/domain/product";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const result = await getPublicProduct(id);
	if (!result) return { title: "Produto não encontrado" };
	const { product } = result;
	return {
		title: product.name,
		description: product.description || undefined,
		openGraph: { images: [productCover(product)] },
	};
}

export default async function ProductPage({ params }: Props) {
	const { id } = await params;
	const result = await getPublicProduct(id);
	if (!result) notFound();
	const { product, category } = result;

	return (
		<div className="min-h-screen bg-background">
			<SiteHeader.Root position="sticky">
				<SiteHeader.Bar>
					<SiteHeader.BackButton />
					<SiteHeader.Brand />
					<SiteHeader.CartButton />
				</SiteHeader.Bar>
			</SiteHeader.Root>

			<main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
				<div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
					<ProductGallery.Root images={product.images} alt={product.name}>
						<ProductGallery.Main />
						<ProductGallery.Thumbnails />
					</ProductGallery.Root>

					<div className="min-w-0 space-y-6 sm:space-y-8">
						<div className="space-y-3">
							{category && <Badge>{category.name}</Badge>}
							<h1 className="font-display text-3xl leading-tight font-semibold break-words text-foreground sm:text-4xl md:text-5xl">
								{product.name}
							</h1>
							{product.description && (
								<p className="text-base leading-relaxed text-muted-foreground sm:text-[17px]">{product.description}</p>
							)}
							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Price cents={product.priceInCents} className="font-display text-4xl font-semibold text-primary" />
								<ShippingBadge />
							</div>
						</div>

						<ProductPurchase.Root product={product}>
							<ProductPurchase.Quantity />
							<ProductPurchase.Sizes />
							<ProductPurchase.Submit />
						</ProductPurchase.Root>

						<ProductDetails details={product.details} description={product.description} />
					</div>
				</div>
			</main>
		</div>
	);
}
