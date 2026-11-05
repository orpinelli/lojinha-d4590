import { PageHeader } from "@/components/admin/blocks";
import { Field } from "@/components/admin/form-fields";
import { SettingsForm } from "@/components/admin/settings-form";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";

export default async function AppearancePage() {
	await requireAdminSession();
	const { settings: service } = await getRequestServices();
	const { branding, theme } = await service.get();

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Aparência</PageHeader.Title>
					<PageHeader.Description>Logo, nome e cores da loja.</PageHeader.Description>
				</PageHeader.Content>
			</PageHeader.Root>

			<div className="space-y-6">
				<SettingsForm.Root section="branding" defaultValues={branding}>
					<SettingsForm.Header title="Identidade" description="Como a loja aparece no site e no navegador." />
					<SettingsForm.Content>
						<Field.Text name="storeName" label="Nome da loja" description="Aparece na aba do navegador." maxLength={60} />
						<Field.Textarea name="description" label="Descrição" description="Usada pelo Google e ao compartilhar o link." />
						<div className="grid gap-5 md:grid-cols-2">
							<Field.Image name="logoUrl" label="Logo" description="Topo do site e rodapé." />
							<Field.Image name="faviconUrl" label="Ícone da aba (favicon)" description="Imagem quadrada." previewClassName="min-[420px]:w-24" />
						</div>
						<Field.Switch
							name="invertFooterLogo"
							label="Logo branca no rodapé"
							description="Inverte as cores da logo para aparecer sobre o fundo escuro do rodapé."
						/>
					</SettingsForm.Content>
					<SettingsForm.Submit />
				</SettingsForm.Root>

				<SettingsForm.Root section="theme" defaultValues={theme}>
					<SettingsForm.Header title="Cores" description="Aplicadas em botões, textos, destaques e rodapé." />
					<SettingsForm.Content>
						<div className="grid gap-5 sm:grid-cols-2">
							<Field.Color name="primary" label="Cor principal" description="Botões, preços em destaque e selos." />
							<Field.Color name="primaryForeground" label="Texto sobre a cor principal" />
							<Field.Color name="background" label="Fundo" />
							<Field.Color name="foreground" label="Texto" />
							<Field.Color name="mutedForeground" label="Texto secundário" />
							<Field.Color name="footerBackground" label="Fundo do rodapé" />
							<Field.Color name="footerForeground" label="Texto do rodapé" />
						</div>
						<SettingsForm.ThemePreview />
					</SettingsForm.Content>
					<SettingsForm.Submit />
				</SettingsForm.Root>
			</div>
		</>
	);
}
