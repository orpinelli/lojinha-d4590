import {
	ProductCardAddButton,
	ProductCardBody,
	ProductCardDescription,
	ProductCardDetailsLink,
	ProductCardFeaturedBadge,
	ProductCardFooter,
	ProductCardMedia,
	ProductCardPrice,
	ProductCardRoot,
	ProductCardShippingBadge,
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
	Description: ProductCardDescription,
	Price: ProductCardPrice,
	SizePicker: ProductCardSizePicker,
	AddButton: ProductCardAddButton,
	DetailsLink: ProductCardDetailsLink,
	FeaturedBadge: ProductCardFeaturedBadge,
	ShippingBadge: ProductCardShippingBadge,
};
