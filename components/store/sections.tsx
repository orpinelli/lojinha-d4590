import Image from "next/image";
import { Instagram } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

/* Server-compatible compound components for the storefront layout. */

/**
 * Compact store title over a soft tint, right under the fixed header (h-16):
 * the first screen is left to the products.
 */
function HeroRoot({ className, children, ...props }: ComponentProps<"section">) {
	return (
		<section
			className={cn(
				"bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_12%,var(--background)),var(--background))] px-4 pt-[88px] pb-5 sm:px-6 sm:pt-24 sm:pb-6 lg:px-10",
				className,
			)}
			{...props}
		>
			<div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">{children}</div>
		</section>
	);
}

function HeroTitle({ className, ...props }: ComponentProps<"h1">) {
	return (
		<h1
			className={cn(
				"font-display text-[26px] leading-tight font-semibold text-balance break-words text-primary sm:text-[32px] lg:text-[40px]",
				className,
			)}
			{...props}
		/>
	);
}

/** Second part of the title, on the same line, in the text color. */
function HeroHighlight({ className, ...props }: ComponentProps<"span">) {
	return <span className={cn("text-foreground", className)} {...props} />;
}

export const Hero = {
	Root: HeroRoot,
	Title: HeroTitle,
	Highlight: HeroHighlight,
};

function ShowcaseSectionRoot({ className, children, ...props }: ComponentProps<"section">) {
	return (
		<section className={cn("scroll-mt-20 px-4 py-8 sm:px-6 sm:py-10 lg:px-10", className)} {...props}>
			<div className="mx-auto w-full max-w-[1440px]">{children}</div>
		</section>
	);
}

function ShowcaseSectionHeader({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("mb-4 space-y-1.5 sm:mb-5", className)} {...props} />;
}

function ShowcaseSectionTitle({ className, ...props }: ComponentProps<"h2">) {
	return (
		<h2
			className={cn(
				"font-display text-[22px] leading-tight font-semibold break-words text-foreground sm:text-[26px]",
				className,
			)}
			{...props}
		/>
	);
}

export const ShowcaseSection = {
	Root: ShowcaseSectionRoot,
	Header: ShowcaseSectionHeader,
	Label: SectionLabel,
	Title: ShowcaseSectionTitle,
};

function FooterRoot({ className, children, ...props }: ComponentProps<"footer">) {
	return (
		<footer
			className={cn("bg-footer px-5 py-12 text-footer-foreground sm:px-10 sm:py-16", className)}
			{...props}
		>
			<div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-6 text-center">
				{children}
			</div>
		</footer>
	);
}

function FooterBrand({ logoUrl, alt, invert }: { logoUrl: string; alt: string; invert?: boolean }) {
	return (
		<Image
			src={logoUrl}
			alt={alt}
			width={200}
			height={67}
			className={cn("h-12 w-auto max-w-full sm:h-14", invert && "brightness-0 invert")}
		/>
	);
}

function FooterSocial({ instagramUrl }: { instagramUrl: string }) {
	if (!instagramUrl) return null;
	return (
		<a
			href={instagramUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Instagram"
			className="inline-flex items-center gap-2 rounded-full bg-footer-foreground/15 px-5 py-2.5 text-sm font-extrabold tracking-[0.5px] uppercase transition hover:bg-footer-foreground/25"
		>
			<Instagram className="size-5" />
			Instagram
		</a>
	);
}

function FooterCopyright({ children }: { children: ReactNode }) {
	if (!children) return null;
	return <p className="text-xs font-bold tracking-[1px] uppercase opacity-80">{children}</p>;
}

export const SiteFooter = {
	Root: FooterRoot,
	Brand: FooterBrand,
	Social: FooterSocial,
	Copyright: FooterCopyright,
};
