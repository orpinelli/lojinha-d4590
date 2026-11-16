import { ProductGalleryMain, ProductGalleryRoot, ProductGalleryThumbnails } from "./product-gallery";
import { ProductGalleryViewer } from "./product-gallery-viewer";

/**
 * <ProductGallery.Root images alt>
 *   <ProductGallery.Main />        photo with zoom under the mouse; opens the viewer
 *   <ProductGallery.Thumbnails />
 *   <ProductGallery.Viewer />      full screen: pinch / double tap / drag
 * </ProductGallery.Root>
 */
export const ProductGallery = {
	Root: ProductGalleryRoot,
	Main: ProductGalleryMain,
	Thumbnails: ProductGalleryThumbnails,
	Viewer: ProductGalleryViewer,
};
