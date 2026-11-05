import Link from "next/link";
import { Database, FileText, Package, Palette, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, ShortcutCard, StatCard } from "@/components/admin/blocks";
import { getDataProviderName, getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";

export default async function DashboardPage() {
	const session = await requireAdminSession();
	const { catalog } = await getRequestServices();
	const [products, categories] = await Promise.all([
		catalog.listProducts(),
		catalog.listCategories(),
	]);
	const active = products.filter((product) => product.active).length;
	const stats = [
		{ label: "Produtos visíveis", value: active },
		{ label: "Produtos ocultos", value: products.length - active },
		{ label: "Em destaque", value: products.filter((product) => product.featured && product.active).length },
		{ label: "Categorias", value: categories.length },
	];
	const isLocal = getDataProviderName() === "local";

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Visão geral</PageHeader.Title>
					<PageHeader.Description className="break-all">Conectado como {session.email}</PageHeader.Description>
				</PageHeader.Content>
				<PageHeader.Actions>
					<Button asChild className="h-10">
						<Link href="/gerenciamento/produtos/novo">
							<Plus /> Novo produto
						</Link>
					</Button>
				</PageHeader.Actions>
			</PageHeader.Root>

			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				{stats.map((stat) => (
					<StatCard.Root key={stat.label}>
						<StatCard.Label>{stat.label}</StatCard.Label>
						<StatCard.Value>{stat.value}</StatCard.Value>
					</StatCard.Root>
				))}
			</div>

			<h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground uppercase">Atalhos</h2>
			<div className="grid gap-3 md:grid-cols-2">
				<ShortcutCard href="/gerenciamento/produtos" icon={<Package />} title="Produtos" description="Preços, fotos, tamanhos e descrições." />
				<ShortcutCard href="/gerenciamento/categorias" icon={<Tags />} title="Categorias" description="Seções e menu da loja." />
				<ShortcutCard href="/gerenciamento/aparencia" icon={<Palette />} title="Aparência" description="Logo, nome e cores da loja." />
				<ShortcutCard href="/gerenciamento/conteudo" icon={<FileText />} title="Textos e contato" description="Topo, selos, WhatsApp, Instagram e rodapé." />
			</div>

			<div className="mt-8 flex gap-3 rounded-lg border bg-background p-4 text-sm">
				<Database className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
				{isLocal ? (
					<p className="text-muted-foreground">
						<strong className="text-foreground">Modo local.</strong> Os dados estão sendo salvos em
						arquivos neste computador (pasta <code>.storage</code>). Para publicar na internet, use o
						Supabase (<code>DATA_PROVIDER=supabase</code>).
					</p>
				) : (
					<p className="text-muted-foreground">
						<strong className="text-foreground">Conectado ao Supabase.</strong> Os dados ficam no banco
						protegido por Row Level Security.
					</p>
				)}
			</div>
		</>
	);
}
