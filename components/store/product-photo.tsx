import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Background of every frame that shows a product photo: white, like most
 * product photos, so the spare space around a photo of another shape disappears.
 * Big frames (product page, cards) are 4:5, the shape of most of the store photos;
 * small thumbnails stay square.
 */
export const PRODUCT_PHOTO_FRAME = "bg-white";

/**
 * Product photo that always shows whole, never cropped: whatever its shape
 * (tall, wide or square), the browser scales it to the largest size that fits
 * the frame. Fills the nearest positioned parent (`relative` frame).
 */
export function ProductPhoto({
	src,
	alt = "",
	sizes,
	priority,
	className,
}: {
	src: string;
	alt?: string;
	sizes: string;
	priority?: boolean;
	className?: string;
}) {
	return (
		<Image
			src={src}
			alt={alt}
			fill
			sizes={sizes}
			priority={priority}
			className={cn("object-contain", className)}
		/>
	);
}
