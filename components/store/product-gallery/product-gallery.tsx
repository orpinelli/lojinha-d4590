"use client";

import Image from "next/image";
import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Carousel } from "../carousel";

type GalleryContextValue = {
	images: string[];
	alt: string;
	selected: number;
	select: (index: number) => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

function useGallery() {
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
	return (
		<GalleryContext.Provider value={{ images, alt, selected, select }}>
			<div className={cn("min-w-0 space-y-4 sm:space-y-6", className)}>{children}</div>
		</GalleryContext.Provider>
	);
}

export function ProductGalleryMain() {
	const { images, alt, selected } = useGallery();
	return (
		<div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 bg-muted">
			<Image
				src={images[selected] ?? images[0]}
				alt={alt}
				fill
				priority
				sizes="(max-width: 1024px) 100vw, 50vw"
				className="object-cover"
			/>
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
				"relative aspect-square w-full overflow-hidden rounded-xl border-2 bg-muted transition-colors",
				active ? "border-primary" : "hover:border-stroke",
			)}
		>
			<Image src={image} alt="" fill sizes="(max-width: 768px) 25vw, 12vw" className="object-cover" />
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
