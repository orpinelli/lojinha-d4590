"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { matchesSearch } from "@/modules/shared/domain/search";

/*
 * Instant search over a server-rendered list. The list items stay server
 * components; each one is wrapped in <ListSearch.Item terms> and simply hides
 * when it doesn't match. The query also goes to the URL (?busca=), so links,
 * reloads and the back button keep it.
 *
 * <ListSearch.Root allTerms initialQuery>
 *   <ListSearch.Input label placeholder />
 *   <ListSearch.Status noun="pedido" nounPlural="pedidos" />
 *   <ul>{items.map(item => <ListSearch.Item terms>…</ListSearch.Item>)}</ul>
 *   <ListSearch.Empty />
 * </ListSearch.Root>
 */

const PARAM = "busca";

type ListSearchContextValue = {
	query: string;
	setQuery: (query: string) => void;
	total: number;
	matches: number;
};

const ListSearchContext = createContext<ListSearchContextValue | null>(null);

function useListSearch() {
	const context = useContext(ListSearchContext);
	if (!context) throw new Error("Use as partes do ListSearch dentro de <ListSearch.Root>");
	return context;
}

export function ListSearchRoot({
	allTerms,
	initialQuery = "",
	children,
}: {
	/** Search terms of every item (used for the counts). */
	allTerms: string[][];
	initialQuery?: string;
	children: ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const [query, setQueryState] = useState(initialQuery);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => () => clearTimeout(timer.current), []);

	const setQuery = (next: string) => {
		setQueryState(next);
		// The list filters right away; the URL follows once typing pauses.
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			const params = new URLSearchParams(window.location.search);
			if (next.trim()) params.set(PARAM, next.trim());
			else params.delete(PARAM);
			const search = params.toString();
			router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
		}, 400);
	};

	const matches = allTerms.filter((terms) => matchesSearch(query, terms)).length;

	return (
		<ListSearchContext.Provider value={{ query, setQuery, total: allTerms.length, matches }}>
			{children}
		</ListSearchContext.Provider>
	);
}

export function ListSearchInput({ label, placeholder }: { label: string; placeholder: string }) {
	const { query, setQuery } = useListSearch();
	return (
		<div role="search" className="relative">
			<Search
				aria-hidden
				className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-label"
			/>
			<Input
				aria-label={label}
				placeholder={placeholder}
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Escape" && query) setQuery("");
				}}
				autoComplete="off"
				spellCheck={false}
				inputMode="search"
				enterKeyHint="search"
				className="pr-12 pl-11"
			/>
			{query && (
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setQuery("")}
					aria-label="Limpar busca"
					className="absolute top-1/2 right-1.5 size-9 -translate-y-1/2 text-label hover:bg-muted hover:text-foreground"
				>
					<X />
				</Button>
			)}
		</div>
	);
}

/** "3 de 12 pedidos" while searching (read out by screen readers). */
export function ListSearchStatus({ noun, nounPlural }: { noun: string; nounPlural: string }) {
	const { query, total, matches } = useListSearch();
	return (
		<p aria-live="polite" className="mb-3 text-sm font-semibold text-muted-foreground empty:hidden">
			{query.trim() && matches > 0 ? `${matches} de ${total} ${total === 1 ? noun : nounPlural}` : null}
		</p>
	);
}

/** Renders its children only when they match the query. */
export function ListSearchItem({ terms, children }: { terms: string[]; children: ReactNode }) {
	const { query } = useListSearch();
	return matchesSearch(query, terms) ? <>{children}</> : null;
}

export function ListSearchEmpty({ message }: { message: string }) {
	const { query, matches, setQuery } = useListSearch();
	if (!query.trim() || matches > 0) return null;
	return (
		<div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center">
			<p className="font-display text-xl font-semibold text-foreground">
				{message} “{query.trim()}”
			</p>
			<p className="text-sm text-muted-foreground">Confira o nome ou o número do pedido.</p>
			<Button variant="outline" size="sm" onClick={() => setQuery("")} className="mt-1">
				Limpar busca
			</Button>
		</div>
	);
}
