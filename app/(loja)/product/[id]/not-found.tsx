import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="flex max-w-sm flex-col items-center gap-4 text-center">
				<span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
					<SearchX className="size-7" strokeWidth={2.5} />
				</span>
				<h1 className="font-display text-3xl font-semibold text-foreground">Produto não encontrado</h1>
				<p className="text-muted-foreground">Ele pode ter saído da loja. Que tal ver os outros?</p>
				<Button asChild size="lg" className="mt-2">
					<Link href="/">Voltar à loja</Link>
				</Button>
			</div>
		</div>
	);
}
