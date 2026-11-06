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
	type ReactNode,
} from "react";
import { ArrowLeft, Menu, ShoppingCart, X } from "lucide-react";
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
	children: ReactNode;
}) {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuId = useId();

	return (
		<SiteHeaderContext.Provider value={{ menuOpen, setMenuOpen, menuId }}>
			<header
				className={cn(
					"top-0 z-40 border-b-2 bg-background",
					position === "fixed" ? "fixed inset-x-0" : "sticky",
					className,
				)}
			>
				<div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">{children}</div>
			</header>
		</SiteHeaderContext.Provider>
	);
}

export function SiteHeaderBar({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("flex h-16 items-center justify-between gap-3", className)} {...props} />;
}

/** Logo + divider + store name label (label hidden on small phones). */
export function SiteHeaderBrand() {
	const { branding } = useSiteSettings();
	return (
		<Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${branding.storeName} — início`}>
			<Image
				src={branding.logoUrl}
				alt=""
				width={140}
				height={33}
				priority
				className="h-8 w-auto max-w-[120px] object-contain sm:max-w-[140px]"
			/>
			<span aria-hidden className="hidden h-6 w-px shrink-0 bg-border sm:block" />
			<span aria-hidden className="hidden truncate text-[11px] font-bold tracking-[1.5px] text-label uppercase sm:block">
				{branding.storeName}
			</span>
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
				"rounded-lg px-3 py-2 text-[13px] font-bold tracking-[0.5px] text-label uppercase transition-colors hover:bg-primary/10 hover:text-primary",
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
		<nav aria-label="Vitrines" className="hidden items-center gap-1 min-[900px]:flex">
			{items.map((item) => (
				<SectionLink key={item.id} item={item} />
			))}
		</nav>
	);
}

export function SiteHeaderMobileNav({ items }: { items: SiteNavItem[] }) {
	const { menuOpen, menuId } = useSiteHeader();
	if (!menuOpen || items.length === 0) return null;
	return (
		<nav id={menuId} aria-label="Vitrines" className="flex flex-col border-t-2 py-2 min-[900px]:hidden">
			{items.map((item) => (
				<SectionLink key={item.id} item={item} className="px-2 py-3 text-sm" />
			))}
		</nav>
	);
}

export function SiteHeaderActions({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("flex shrink-0 items-center gap-1", className)} {...props} />;
}

const iconButton =
	"relative flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-primary/10 hover:text-primary";

export function SiteHeaderCartButton() {
	const { count, openCart } = useCart();
	return (
		<button
			type="button"
			onClick={openCart}
			aria-label={count > 0 ? `Abrir carrinho (${count} itens)` : "Abrir carrinho"}
			className={iconButton}
		>
			<ShoppingCart className="size-5" strokeWidth={2.5} />
			{count > 0 && (
				<span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
					{count}
				</span>
			)}
		</button>
	);
}

export function SiteHeaderMenuToggle({ hasItems = true }: { hasItems?: boolean }) {
	const { menuOpen, setMenuOpen, menuId } = useSiteHeader();
	if (!hasItems) return null;
	return (
		<button
			type="button"
			onClick={() => setMenuOpen(!menuOpen)}
			aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
			aria-expanded={menuOpen}
			aria-controls={menuId}
			className={cn(iconButton, "min-[900px]:hidden")}
		>
			{menuOpen ? <X className="size-5" strokeWidth={2.5} /> : <Menu className="size-5" strokeWidth={2.5} />}
		</button>
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
		<Button variant="ghost" size="sm" onClick={goBack} className="px-2 text-label hover:text-primary">
			<ArrowLeft strokeWidth={3} /> Voltar
		</Button>
	);
}
