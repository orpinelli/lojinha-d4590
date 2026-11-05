import Image from "next/image";
import { Instagram } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Server-compatible compound components for the storefront layout. */

function HeroRoot({ className, children, ...props }: ComponentProps<"section">) {
	return (
		<section className={cn("px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16 md:pt-32", className)} {...props}>
			<div className="mx-auto w-full max-w-5xl text-center">{children}</div>
		</section>
	);
}

function HeroTitle({ className, ...props }: ComponentProps<"h1">) {
	return (
		<h1
			className={cn(
				"mb-4 text-4xl font-light tracking-tight break-words text-foreground sm:mb-6 sm:text-5xl md:text-7xl",
				className,
			)}
			{...props}
		/>
	);
}

function HeroHighlight({ className, ...props }: ComponentProps<"span">) {
	return <span className={cn("block font-extralight text-primary", className)} {...props} />;
}

function HeroSubtitle({ className, ...props }: ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mb-12 sm:text-lg md:text-xl",
				className,
			)}
			{...props}
		/>
	);
}

export const Hero = {
	Root: HeroRoot,
	Title: HeroTitle,
	Highlight: HeroHighlight,
	Subtitle: HeroSubtitle,
};

function CategorySectionRoot({ className, children, ...props }: ComponentProps<"section">) {
	return (
		<section className={cn("scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 md:py-20", className)} {...props}>
			<div className="mx-auto w-full max-w-7xl">{children}</div>
		</section>
	);
}

function CategorySectionTitle({ className, ...props }: ComponentProps<"h2">) {
	return (
		<h2
			className={cn(
				"mb-10 text-center text-3xl font-light tracking-tight break-words text-foreground sm:mb-14 sm:text-4xl md:text-5xl",
				className,
			)}
			{...props}
		/>
	);
}

export const CategorySection = {
	Root: CategorySectionRoot,
	Title: CategorySectionTitle,
};

function FooterRoot({ className, children, ...props }: ComponentProps<"footer">) {
	return (
		<footer
			className={cn("bg-footer px-4 py-12 text-footer-foreground sm:px-6 sm:py-16", className)}
			{...props}
		>
			<div className="mx-auto w-full max-w-7xl text-center">{children}</div>
		</footer>
	);
}

function FooterBrand({ logoUrl, alt, invert }: { logoUrl: string; alt: string; invert?: boolean }) {
	return (
		<div className="mb-6 flex items-center justify-center sm:mb-8">
			<Image
				src={logoUrl}
				alt={alt}
				width={200}
				height={67}
				className={cn("h-12 w-auto max-w-full sm:h-16", invert && "brightness-0 invert")}
			/>
		</div>
	);
}

function FooterSocial({ instagramUrl }: { instagramUrl: string }) {
	if (!instagramUrl) return null;
	return (
		<div className="mb-5 flex items-center justify-center gap-3">
			<a
				href={instagramUrl}
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Instagram"
				className="inline-flex items-center gap-2 rounded-full bg-footer-foreground/10 px-4 py-2 transition hover:bg-footer-foreground/20"
			>
				<Instagram className="size-5" />
				<span className="text-sm">Instagram</span>
			</a>
		</div>
	);
}

function FooterCopyright({ children }: { children: ReactNode }) {
	if (!children) return null;
	return <p className="text-xs font-light tracking-wide opacity-70 sm:text-sm">{children}</p>;
}

export const SiteFooter = {
	Root: FooterRoot,
	Brand: FooterBrand,
	Social: FooterSocial,
	Copyright: FooterCopyright,
};
