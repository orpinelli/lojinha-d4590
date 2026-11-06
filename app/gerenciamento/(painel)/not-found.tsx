import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/blocks";

export default function AdminNotFound() {
	return (
		<EmptyState.Root>
			<EmptyState.Icon>
				<SearchX />
			</EmptyState.Icon>
			<EmptyState.Title>Não encontrado</EmptyState.Title>
			<EmptyState.Description>O item que você procura não existe ou foi excluído.</EmptyState.Description>
			<EmptyState.Action>
				<Button asChild variant="outline">
					<Link href="/gerenciamento">Voltar ao painel</Link>
				</Button>
			</EmptyState.Action>
		</EmptyState.Root>
	);
}
