"use client";

import {
	createContext,
	useContext,
	useRef,
	useState,
	type PointerEvent,
	type ReactNode,
} from "react";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_PHOTO_FRAME, ProductPhoto } from "@/components/store/product-photo";
import { Carousel } from "../carousel";

type GalleryContextValue = {
	images: string[];
	alt: string;
	selected: number;
	select: (index: number) => void;
	/** Photo open in the full-screen viewer (null = closed). */
	viewerIndex: number | null;
	openViewer: (index: number) => void;
	closeViewer: () => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function useGallery() {
	const context = useContext(GalleryContext);
	if (!context) throw new Error("Use as partes do ProductGallery dentro de <ProductGallery.Root>");
	return context;
}

export function ProductGalleryRoot({
	images,
	alt,
	className,
	children,
}: {
	images: string[];
	alt: string;
	className?: string;
	children: ReactNode;
}) {
	const [selected, select] = useState(0);
	const [viewerIndex, setViewerIndex] = useState<number | null>(null);
	return (
		<GalleryContext.Provider
			value={{
				images,
				alt,
				selected,
				select,
				viewerIndex,
				openViewer: setViewerIndex,
				closeViewer: () => setViewerIndex(null),
			}}
		>
			<div className={cn("min-w-0 space-y-4 sm:space-y-6", className)}>{children}</div>
		</GalleryContext.Provider>
	);
}

/** How much the photo grows under the mouse (desktop). */
const HOVER_ZOOM = 2.2;

/**
 * Main photo. With a mouse, it zooms in under the cursor and follows it; a
 * click (or a tap on phones) opens the full-screen viewer with pinch zoom.
 * On desktop its height follows the screen, so the thumbnails stay in view.
 */
export function ProductGalleryMain() {
	const { images, alt, selected, openViewer } = useGallery();
	const frameRef = useRef<HTMLDivElement>(null);
	const [hoverZoom, setHoverZoom] = useState(false);

	const follow = (event: PointerEvent<HTMLButtonElement>) => {
		if (event.pointerType !== "mouse") return;
		const rect = event.currentTarget.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;
		// Moved straight on the element: no re-render on every mouse move
		frameRef.current?.style.setProperty("transform-origin", `${x}% ${y}%`);
		if (!hoverZoom) setHoverZoom(true);
	};

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={() => openViewer(selected)}
				onPointerMove={follow}
				onPointerLeave={() => setHoverZoom(false)}
				aria-label={`Ampliar foto ${selected + 1} de ${images.length}`}
				className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-2xl border-2 bg-white lg:max-h-[max(28rem,calc(100dvh-21rem))] focus-visible:ring-[3px] focus-visible:ring-link/40 focus-visible:outline-none"
			>
				<div
					ref={frameRef}
					data-zoomed={hoverZoom || undefined}
					className="absolute inset-0 transition-[scale] duration-200 ease-out motion-reduce:transition-none"
					style={{ scale: hoverZoom ? HOVER_ZOOM : 1 }}
				>
					<ProductPhoto
						src={images[selected] ?? images[0]}
						alt={alt}
						priority
						sizes="(max-width: 1024px) 100vw, 50vw"
					/>
				</div>
			</button>
			{/* Hint below the photo, never on top of it (it would hide details) */}
			<p aria-hidden className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
				<ZoomIn className="size-4 shrink-0" strokeWidth={2.5} />
				<span className="pointer-fine:hidden">Toque na foto para ampliar</span>
				<span className="hidden pointer-fine:inline">Passe o mouse para ver de perto · clique para ampliar</span>
			</p>
		</div>
	);
}

function Thumbnail({ image, index }: { image: string; index: number }) {
	const { selected, select } = useGallery();
	const active = selected === index;
	return (
		<button
			type="button"
			onClick={() => select(index)}
			aria-label={`Ver imagem ${index + 1}`}
			aria-pressed={active}
			className={cn(
				"relative aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors",
				PRODUCT_PHOTO_FRAME,
				active ? "border-primary" : "hover:border-stroke",
			)}
		>
			<ProductPhoto src={image} sizes="(max-width: 768px) 25vw, 12vw" />
		</button>
	);
}

const THUMB_BREAKPOINTS = {
	480: { slidesPerView: 5, spaceBetween: 8 },
	768: { slidesPerView: 6, spaceBetween: 10 },
};

export function ProductGalleryThumbnails() {
	const { images } = useGallery();
	if (images.length < 2) return null;

	const thumbnails = images.map((image, index) => (
		<Thumbnail key={`${image}-${index}`} image={image} index={index} />
	));

	if (images.length > 4) {
		return (
			<Carousel.Root>
				<Carousel.Viewport slidesPerView={4} spaceBetween={8} breakpoints={THUMB_BREAKPOINTS}>
					{thumbnails}
				</Carousel.Viewport>
				<Carousel.Previous className="left-1 flex p-1.5 lg:left-1" />
				<Carousel.Next className="right-1 flex p-1.5 lg:right-1" />
			</Carousel.Root>
		);
	}

	return <div className="grid grid-cols-4 gap-2 sm:gap-3">{thumbnails}</div>;
}
