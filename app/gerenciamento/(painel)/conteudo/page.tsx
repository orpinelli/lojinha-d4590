import { PageHeader } from "@/components/admin/blocks";
import { Field } from "@/components/admin/form-fields";
import { SettingsForm } from "@/components/admin/settings-form";
import { getRequestServices } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";

export default async function ContentPage() {
	await requireAdminSession();
	const { settings: service } = await getRequestServices();
	const { hero, labels, contact, footer } = await service.get();

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Textos e contato</PageHeader.Title>
					<PageHeader.Description>Tudo o que é escrito na loja.</PageHeader.Description>
				</PageHeader.Content>
			</PageHeader.Root>

			<div className="space-y-6">
				<SettingsForm.Root section="hero" defaultValues={hero}>
					<SettingsForm.Header title="Topo da página inicial" />
					<SettingsForm.Content>
						<div className="grid gap-5 sm:grid-cols-2">
							<Field.Text name="title" label="Título" maxLength={60} />
							<Field.Text name="highlight" label="Destaque (na cor principal)" maxLength={60} />
						</div>
						<Field.Textarea name="subtitle" label="Subtítulo" />
					</SettingsForm.Content>
					<SettingsForm.Submit />
				</SettingsForm.Root>

				<SettingsForm.Root section="labels" defaultValues={labels}>
					<SettingsForm.Header title="Selos" description="Deixe em branco para esconder o selo." />
					<SettingsForm.Content>
						<div className="grid gap-5 sm:grid-cols-2">
							<Field.Text name="featured" label="Selo dos destaques" placeholder="Mais Vendido" maxLength={30} />
							<Field.Text name="shipping" label="Selo de frete" placeholder="Frete Grátis" maxLength={30} />
						</div>
					</SettingsForm.Content>
					<SettingsForm.Submit />
				</SettingsForm.Root>

				<SettingsForm.Root section="contact" defaultValues={contact}>
					<SettingsForm.Header title="Contato e pedidos" description="Os pedidos do carrinho são enviados por WhatsApp." />
					<SettingsForm.Content>
						<Field.Text
							name="whatsappNumber"
							label="WhatsApp que recebe os pedidos"
							description="Somente números, com 55 + DDD. Ex.: 5519999999999"
							inputMode="numeric"
							maxLength={15}
						/>
						<Field.Textarea name="orderGreeting" label="Mensagem inicial do pedido" rows={2} />
						<Field.Text
							name="instagramUrl"
							label="Instagram"
							type="url"
							placeholder="https://www.instagram.com/..."
							description="Deixe em branco para esconder o botão."
						/>
					</SettingsForm.Content>
					<SettingsForm.Submit />
				</SettingsForm.Root>

				<SettingsForm.Root section="footer" defaultValues={footer}>
					<SettingsForm.Header title="Rodapé" />
					<SettingsForm.Content>
						<Field.Text name="copyright" label="Texto de direitos autorais" maxLength={160} />
					</SettingsForm.Content>
					<SettingsForm.Submit />
				</SettingsForm.Root>
			</div>
		</>
	);
}
