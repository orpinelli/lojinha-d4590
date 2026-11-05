"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ShellContextValue = { mobileOpen: boolean; setMobileOpen: (open: boolean) => void };

const ShellContext = createContext<ShellContextValue | null>(null);

function useShell() {
	const context = useContext(ShellContext);
	if (!context) throw new Error("Use as partes do AdminShell dentro de <AdminShell.Root>");
	return context;
}

/** Sidebar on desktop (≥1024px); top bar + drawer on phones and tablets. */
export function AdminShellRoot({ children }: { children: ReactNode }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();

	useEffect(() => setMobileOpen(false), [pathname]);

	return (
		<ShellContext.Provider value={{ mobileOpen, setMobileOpen }}>
			<div className="min-h-dvh bg-muted/40 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
				{children}
			</div>
		</ShellContext.Provider>
	);
}

export function AdminShellSidebar({ children }: { children: ReactNode }) {
	const { mobileOpen, setMobileOpen } = useShell();
	return (
		<>
			<aside className="sticky top-0 hidden h-dvh flex-col border-r bg-background lg:flex">
				{children}
			</aside>
			<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
				<SheetContent side="left" aria-describedby={undefined} className="w-[85vw] max-w-xs lg:hidden">
					<SheetTitle className="sr-only">Menu do painel</SheetTitle>
					{children}
				</SheetContent>
			</Sheet>
		</>
	);
}

export function AdminShellBrand({ logoUrl, storeName }: { logoUrl: string; storeName: string }) {
	return (
		<div className="flex h-16 shrink-0 items-center gap-3 border-b px-5 pr-14 lg:pr-5">
			<Image src={logoUrl} alt="" width={96} height={32} className="h-8 w-auto max-w-24 object-contain" />
			<div className="min-w-0">
				<p className="truncate text-sm font-semibold">{storeName}</p>
				<p className="text-xs text-muted-foreground">Gerenciamento</p>
			</div>
		</div>
	);
}

export function AdminShellNav({ children }: { children: ReactNode }) {
	return (
		<nav aria-label="Painel" className="flex-1 space-y-1 overflow-y-auto p-3">
			{children}
		</nav>
	);
}

export const adminNavItemClass =
	"flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors [&_svg]:size-4 [&_svg]:shrink-0";

export function AdminShellNavLink({
	href,
	icon,
	children,
	exact = false,
}: {
	href: string;
	icon: ReactNode;
	children: ReactNode;
	exact?: boolean;
}) {
	const pathname = usePathname();
	const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
	return (
		<Link
			href={href}
			aria-current={active ? "page" : undefined}
			className={cn(
				adminNavItemClass,
				active
					? "bg-primary text-primary-foreground"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{icon}
			<span className="truncate">{children}</span>
		</Link>
	);
}

export function AdminShellExternalLink({
	href,
	icon,
	children,
}: {
	href: string;
	icon: ReactNode;
	children: ReactNode;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(adminNavItemClass, "text-muted-foreground hover:bg-muted hover:text-foreground")}
		>
			{icon}
			<span className="truncate">{children}</span>
		</a>
	);
}

export function AdminShellSidebarFooter({ children }: { children: ReactNode }) {
	return <div className="shrink-0 space-y-1 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{children}</div>;
}

export function AdminShellUser({ email }: { email: string }) {
	return (
		<p className="truncate px-3 pb-2 text-xs text-muted-foreground" title={email}>
			{email}
		</p>
	);
}

export function AdminShellMain({ children }: { children: ReactNode }) {
	return <div className="flex min-w-0 flex-col">{children}</div>;
}

export function AdminShellTopBar({ storeName }: { storeName: string }) {
	const { setMobileOpen } = useShell();
	return (
		<header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-2 backdrop-blur sm:px-4 lg:hidden">
			<Button
				variant="ghost"
				onClick={() => setMobileOpen(true)}
				aria-label="Abrir menu do painel"
				className="size-10 p-0 hover:bg-muted hover:text-foreground"
			>
				<Menu className="size-5" />
			</Button>
			<div className="min-w-0">
				<p className="truncate text-sm font-semibold">{storeName}</p>
			</div>
		</header>
	);
}

export function AdminShellContent({ children }: { children: ReactNode }) {
	return (
		<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
			{children}
		</main>
	);
}
