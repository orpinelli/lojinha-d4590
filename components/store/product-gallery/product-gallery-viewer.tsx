"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard, Zoom } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import "swiper/css/zoom";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useGallery } from "./product-gallery";

const MAX_ZOOM = 3;

const toolButton =
	"flex size-11 shrink-0 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25 focus-visible:ring-[3px] focus-visible:ring-white/60 focus-visible:outline-none disabled:opacity-30 [&_svg]:size-5";

/**
 * Full-screen photos. Phones: pinch or double tap to zoom, drag to look
 * around, swipe for the next photo. Mouse: double click or the button zooms,
 * moving the mouse looks around; arrows and keyboard change the photo.
 */
export function ProductGalleryViewer() {
	const { images, alt, viewerIndex, closeViewer, select } = useGallery();
	const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
	const [current, setCurrent] = useState(0);
	const [zoomed, setZoomed] = useState(false);
	const many = images.length > 1;

	return (
		<Dialog
			open={viewerIndex !== null}
			onOpenChange={(open) => {
				if (!open) {
					closeViewer();
					setZoomed(false);
				}
			}}
		>
			<DialogContent
				showCloseButton={false}
				aria-describedby={undefined}
				className="top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-black p-0 text-white shadow-none sm:max-w-none sm:p-0"
			>
				<DialogTitle className="sr-only">Fotos de {alt}</DialogTitle>

				<div className="flex items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-5">
					<p aria-live="polite" className="text-sm font-extrabold tracking-[1px] tabular-nums">
						{current + 1} / {images.length}
					</p>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => (zoomed ? swiper?.zoom.out() : swiper?.zoom.in())}
							aria-label={zoomed ? "Diminuir o zoom" : "Ampliar a foto"}
							className={toolButton}
						>
							{zoomed ? <ZoomOut /> : <ZoomIn />}
						</button>
						<DialogClose asChild>
							<button type="button" aria-label="Fechar as fotos" className={toolButton}>
								<X />
							</button>
						</DialogClose>
					</div>
				</div>

				<div className="relative min-h-0 flex-1">
					<Swiper
						className="h-full"
						modules={[Zoom, Keyboard]}
						zoom={{ maxRatio: MAX_ZOOM, toggle: true, panOnMouseMove: true }}
						keyboard={{ enabled: true }}
						initialSlide={viewerIndex ?? 0}
						onSwiper={(instance) => {
							setSwiper(instance);
							setCurrent(instance.activeIndex);
						}}
						onSlideChange={(instance) => {
							setCurrent(instance.activeIndex);
							select(instance.activeIndex);
							setZoomed(false);
						}}
						onZoomChange={(_instance, scale) => setZoomed(scale > 1)}
					>
						{images.map((image, index) => (
							<SwiperSlide key={`${image}-${index}`}>
								<div className="swiper-zoom-container">
									{/* Plain <img>: the original file, sharp when zoomed in */}
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={image}
										alt={`${alt}, foto ${index + 1} de ${images.length}`}
										draggable={false}
										className="select-none"
									/>
								</div>
							</SwiperSlide>
						))}
					</Swiper>

					{many && (
						<>
							<button
								type="button"
								onClick={() => swiper?.slidePrev()}
								disabled={current === 0}
								aria-label="Foto anterior"
								className={cn(toolButton, "absolute top-1/2 left-3 z-10 hidden -translate-y-1/2 pointer-fine:flex")}
							>
								<ChevronLeft />
							</button>
							<button
								type="button"
								onClick={() => swiper?.slideNext()}
								disabled={current === images.length - 1}
								aria-label="Próxima foto"
								className={cn(toolButton, "absolute top-1/2 right-3 z-10 hidden -translate-y-1/2 pointer-fine:flex")}
							>
								<ChevronRight />
							</button>
						</>
					)}
				</div>

				<p className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-[13px] font-semibold text-white/70">
					<span className="pointer-fine:hidden">
						Toque duas vezes ou use dois dedos para ampliar · arraste para ver os detalhes
					</span>
					<span className="hidden pointer-fine:inline">
						Clique duas vezes na foto para ampliar · mova o mouse para ver os detalhes
					</span>
				</p>
			</DialogContent>
		</Dialog>
	);
}
