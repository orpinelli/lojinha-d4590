import type React from "react";
import { ExternalLink, FileText, LayoutDashboard, Package, Palette, Tags } from "lucide-react";
import { LogoutButton } from "@/components/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSiteSettings } from "@/lib/server/queries";
import { requireAdminSession } from "@/lib/server/session";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
	const session = await requireAdminSession();
	const { branding } = await getSiteSettings();

	return (
		<AdminShell.Root>
			<AdminShell.Sidebar>
				<AdminShell.Brand logoUrl={branding.logoUrl} storeName={branding.storeName} />
				<AdminShell.Nav>
					<AdminShell.NavLink href="/gerenciamento" exact icon={<LayoutDashboard />}>
						Visão geral
					</AdminShell.NavLink>
					<AdminShell.NavLink href="/gerenciamento/produtos" icon={<Package />}>
						Produtos
					</AdminShell.NavLink>
					<AdminShell.NavLink href="/gerenciamento/categorias" icon={<Tags />}>
						Categorias
					</AdminShell.NavLink>
					<AdminShell.NavLink href="/gerenciamento/aparencia" icon={<Palette />}>
						Aparência
					</AdminShell.NavLink>
					<AdminShell.NavLink href="/gerenciamento/conteudo" icon={<FileText />}>
						Textos e contato
					</AdminShell.NavLink>
				</AdminShell.Nav>
				<AdminShell.SidebarFooter>
					<AdminShell.User email={session.email} />
					<AdminShell.ExternalLink href="/" icon={<ExternalLink />}>
						Ver loja
					</AdminShell.ExternalLink>
					<LogoutButton />
				</AdminShell.SidebarFooter>
			</AdminShell.Sidebar>
			<AdminShell.Main>
				<AdminShell.TopBar storeName={branding.storeName} />
				<AdminShell.Content>{children}</AdminShell.Content>
			</AdminShell.Main>
		</AdminShell.Root>
	);
}
