import Image from "next/image";
import { Instagram } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

/* Server-compatible compound components for the storefront layout. */

function HeroRoot({ className, children, ...props }: ComponentProps<"section">) {
	return (
		<section
			className={cn(
				"bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_12%,var(--background)),var(--background))] px-5 pt-[104px] pb-10 min-[600px]:px-10 min-[600px]:pt-[120px]",
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
				"font-display text-[28px] leading-[1.1] font-semibold break-words text-primary min-[600px]:text-[36px] min-[900px]:text-[52px]",
				className,
			)}
			{...props}
		/>
	);
}

function HeroHighlight({ className, ...props }: ComponentProps<"span">) {
	return <span className={cn("block text-foreground", className)} {...props} />;
}

function HeroSubtitle({ className, ...props }: ComponentProps<"p">) {
	return (
		<p
			className={cn("mt-4 max-w-[520px] text-[17px] leading-normal text-muted-foreground", className)}
			{...props}
		/>
	);
}

/** Buttons stack (max 280px wide) on phones and tablets, side by side on desktop. */
function HeroActions({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"mt-8 flex w-full flex-col items-center gap-3 pb-1 *:w-full *:max-w-[280px] min-[900px]:w-auto min-[900px]:flex-row min-[900px]:*:w-auto min-[900px]:*:max-w-none",
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
	Actions: HeroActions,
};

function ShowcaseSectionRoot({ className, children, ...props }: ComponentProps<"section">) {
	return (
		<section className={cn("scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14 lg:px-10", className)} {...props}>
			<div className="mx-auto w-full max-w-[1440px]">{children}</div>
		</section>
	);
}

function ShowcaseSectionHeader({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("mb-6 space-y-2 sm:mb-8", className)} {...props} />;
}

function ShowcaseSectionTitle({ className, ...props }: ComponentProps<"h2">) {
	return (
		<h2
			className={cn(
				"font-display text-2xl leading-tight font-semibold break-words text-foreground sm:text-[28px]",
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
