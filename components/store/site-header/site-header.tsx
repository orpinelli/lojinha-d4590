"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	createContext,
	useContext,
	useId,
	useState,
	type ComponentProps,
	type MouseEvent,
} from "react";
import { ArrowLeft, Menu, ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { cn } from "@/lib/utils";

export type SiteNavItem = { id: string; label: string };

type SiteHeaderContextValue = {
	menuOpen: boolean;
	setMenuOpen: (open: boolean) => void;
	menuId: string;
};

const SiteHeaderContext = createContext<SiteHeaderContextValue | null>(null);

function useSiteHeader() {
	const context = useContext(SiteHeaderContext);
	if (!context) throw new Error("Use as partes do SiteHeader dentro de <SiteHeader.Root>");
	return context;
}

export function SiteHeaderRoot({
	position = "fixed",
	className,
	children,
}: {
	position?: "fixed" | "sticky";
	className?: string;
	children: React.ReactNode;
}) {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuId = useId();

	return (
		<SiteHeaderContext.Provider value={{ menuOpen, setMenuOpen, menuId }}>
			<header
				className={cn(
					"top-0 z-40 border-b",
					position === "fixed"
						? "fixed inset-x-0 bg-background/95 backdrop-blur-sm"
						: "sticky bg-background",
					className,
				)}
			>
				<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">{children}</div>
			</header>
		</SiteHeaderContext.Provider>
	);
}

export function SiteHeaderBar({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("flex items-center justify-between gap-2", className)} {...props} />;
}

export function SiteHeaderBrand({ size = "md" }: { size?: "md" | "sm" }) {
	const { branding } = useSiteSettings();
	return (
		<Link href="/" className="flex min-w-0 shrink items-center" aria-label={`${branding.storeName} — início`}>
			<Image
				src={branding.logoUrl}
				alt={branding.storeName}
				width={160}
				height={54}
				priority
				className={cn("w-auto max-w-[45vw] object-contain", size === "md" ? "h-10 sm:h-12" : "h-8 sm:h-10")}
			/>
		</Link>
	);
}

function SectionLink({ item, className }: { item: SiteNavItem; className?: string }) {
	const { setMenuOpen } = useSiteHeader();
	const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
		const target = document.getElementById(item.id);
		if (target) {
			event.preventDefault();
			target.scrollIntoView({ behavior: "smooth" });
		}
		setMenuOpen(false);
	};
	return (
		<a
			href={`#${item.id}`}
			onClick={onClick}
			className={cn(
				"font-light tracking-wide text-foreground uppercase transition-colors hover:text-primary",
				className,
			)}
		>
			{item.label}
		</a>
	);
}

export function SiteHeaderNav({ items }: { items: SiteNavItem[] }) {
	if (items.length === 0) return null;
	return (
		<nav aria-label="Categorias" className="hidden items-center gap-6 md:flex lg:gap-12">
			{items.map((item) => (
				<SectionLink key={item.id} item={item} className="text-xs lg:text-sm" />
			))}
		</nav>
	);
}

export function SiteHeaderMobileNav({ items }: { items: SiteNavItem[] }) {
	const { menuOpen, menuId } = useSiteHeader();
	if (!menuOpen || items.length === 0) return null;
	return (
		<nav id={menuId} aria-label="Categorias" className="mt-4 border-t pt-2 pb-2 md:hidden">
			{items.map((item) => (
				<SectionLink key={item.id} item={item} className="block w-full py-3 text-left text-sm" />
			))}
		</nav>
	);
}

export function SiteHeaderActions({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("flex shrink-0 items-center gap-1 sm:gap-3", className)} {...props} />;
}

export function SiteHeaderCartButton() {
	const { count, openCart } = useCart();
	return (
		<Button
			variant="ghost"
			onClick={openCart}
			aria-label={count > 0 ? `Abrir carrinho (${count} itens)` : "Abrir carrinho"}
			className="relative size-10 p-0 hover:bg-muted"
		>
			<ShoppingCart className="size-5 text-foreground" />
			{count > 0 && (
				<Badge className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
					{count}
				</Badge>
			)}
		</Button>
	);
}

export function SiteHeaderMenuToggle({ hasItems = true }: { hasItems?: boolean }) {
	const { menuOpen, setMenuOpen, menuId } = useSiteHeader();
	if (!hasItems) return null;
	return (
		<Button
			variant="ghost"
			onClick={() => setMenuOpen(!menuOpen)}
			aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
			aria-expanded={menuOpen}
			aria-controls={menuId}
			className="size-10 p-0 hover:bg-muted md:hidden"
		>
			{menuOpen ? <X className="size-5 text-foreground" /> : <Menu className="size-5 text-foreground" />}
		</Button>
	);
}

/** Goes back when there is history; opens the store home otherwise. */
export function SiteHeaderBackButton() {
	const router = useRouter();
	const goBack = () => {
		if (window.history.length > 1) router.back();
		else router.push("/");
	};
	return (
		<Button
			variant="ghost"
			onClick={goBack}
			className="h-10 px-2 text-sm font-light tracking-wide text-foreground uppercase hover:bg-primary hover:text-primary-foreground sm:px-3"
		>
			<ArrowLeft className="size-4" /> Voltar
		</Button>
	);
}
