import {
	ProductCardAddButton,
	ProductCardBody,
	ProductCardDetailsLink,
	ProductCardFeaturedBadge,
	ProductCardFooter,
	ProductCardMedia,
	ProductCardPrice,
	ProductCardRoot,
	ProductCardSizePicker,
	ProductCardTitle,
} from "./product-card";

/**
 * Compound component. Assembled outside the "use client" module so Server
 * Components can use `<ProductCard.Root>` safely.
 */
export const ProductCard = {
	Root: ProductCardRoot,
	Media: ProductCardMedia,
	Body: ProductCardBody,
	Footer: ProductCardFooter,
	Title: ProductCardTitle,
	Price: ProductCardPrice,
	SizePicker: ProductCardSizePicker,
	AddButton: ProductCardAddButton,
	DetailsLink: ProductCardDetailsLink,
	FeaturedBadge: ProductCardFeaturedBadge,
};
