"use client";

import {
	Children,
	createContext,
	isValidElement,
	useContext,
	useState,
	type ComponentProps,
	type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperInstance, SwiperOptions } from "swiper/types";
import { cn } from "@/lib/utils";
import "swiper/css";
import "swiper/css/pagination";

type CarouselContextValue = {
	swiper: SwiperInstance | null;
	setSwiper: (swiper: SwiperInstance) => void;
	/** True when every slide fits on screen (nothing to slide). */
	locked: boolean;
	setLocked: (locked: boolean) => void;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarousel() {
	const context = useContext(CarouselContext);
	if (!context) throw new Error("Use as partes do Carousel dentro de <Carousel.Root>");
	return context;
}

export function CarouselRoot({ className, ...props }: ComponentProps<"div">) {
	const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
	const [locked, setLocked] = useState(false);
	return (
		<CarouselContext.Provider value={{ swiper, setSwiper, locked, setLocked }}>
			<div className={cn("relative", className)} {...props} />
		</CarouselContext.Provider>
	);
}

/** Each child becomes a slide; works with Server Component children. */
export function CarouselViewport({
	children,
	className,
	slideClassName,
	slidesPerView = 1,
	spaceBetween = 16,
	breakpoints,
	loop = false,
	autoplayDelay,
	pagination = false,
	label,
}: {
	children: ReactNode;
	className?: string;
	slideClassName?: string;
	/** Fractional values (e.g. 1.2) show part of the next slide. */
	slidesPerView?: number;
	spaceBetween?: number;
	breakpoints?: SwiperOptions["breakpoints"];
	loop?: boolean;
	autoplayDelay?: number;
	pagination?: boolean;
	label?: string;
}) {
	const { setSwiper, setLocked } = useCarousel();
	const slides = Children.toArray(children);

	return (
		<Swiper
			modules={[Pagination, Autoplay]}
			onSwiper={(instance) => {
				setSwiper(instance);
				setLocked(instance.isLocked);
			}}
			onLock={() => setLocked(true)}
			onUnlock={() => setLocked(false)}
			slidesPerView={slidesPerView}
			spaceBetween={spaceBetween}
			breakpoints={breakpoints}
			loop={loop}
			autoplay={autoplayDelay ? { delay: autoplayDelay, disableOnInteraction: false } : false}
			pagination={pagination ? { clickable: true } : false}
			className={cn("w-full", className)}
			aria-label={label}
		>
			{slides.map((slide, index) => (
				<SwiperSlide
					key={isValidElement(slide) && slide.key != null ? slide.key : index}
					className={slideClassName}
				>
					{slide}
				</SwiperSlide>
			))}
		</Swiper>
	);
}

const arrowClass =
	"absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-background p-2 shadow-lg transition-colors hover:bg-muted md:flex";

export function CarouselPrevious({ className, ...props }: ComponentProps<"button">) {
	const { swiper, locked } = useCarousel();
	if (locked) return null;
	return (
		<button
			type="button"
			aria-label="Anterior"
			onClick={() => swiper?.slidePrev()}
			className={cn(arrowClass, "-left-2 lg:-left-4", className)}
			{...props}
		>
			<ChevronLeft className="size-5 text-muted-foreground" />
		</button>
	);
}

export function CarouselNext({ className, ...props }: ComponentProps<"button">) {
	const { swiper, locked } = useCarousel();
	if (locked) return null;
	return (
		<button
			type="button"
			aria-label="Próximo"
			onClick={() => swiper?.slideNext()}
			className={cn(arrowClass, "-right-2 lg:-right-4", className)}
			{...props}
		>
			<ChevronRight className="size-5 text-muted-foreground" />
		</button>
	);
}
