import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="text-center">
				<h1 className="mb-6 text-2xl font-light text-foreground">Produto não encontrado</h1>
				<Button
					asChild
					className="bg-primary text-sm font-light tracking-wide text-primary-foreground uppercase hover:bg-primary-hover"
				>
					<Link href="/">Voltar à loja</Link>
				</Button>
			</div>
		</div>
	);
}
