import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/actions";
import { PageHeader } from "@/components/admin/blocks";
import { ShowcaseForm } from "@/components/admin/showcase-form";
import { getRequestServices } from "@/lib/server/container";
import { loadShowcaseEditorData } from "@/lib/server/editor-data";
import { requireAdminSession } from "@/lib/server/session";
import { NotFoundError } from "@/modules/shared/domain/errors";

type Props = { params: Promise<{ id: string }> };

export default async function EditShowcasePage({ params }: Props) {
	await requireAdminSession();
	const { id } = await params;
	const services = await getRequestServices();
	const [showcase, data] = await Promise.all([
		services.showcases.get(id).catch((error) => {
			if (error instanceof NotFoundError) return null;
			throw error;
		}),
		loadShowcaseEditorData(services),
	]);
	if (!showcase) notFound();

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>{showcase.title}</PageHeader.Title>
					<PageHeader.Description>Editar vitrine</PageHeader.Description>
				</PageHeader.Content>
				<PageHeader.Actions>
					<Button asChild variant="outline">
						<a href="/" target="_blank" rel="noopener noreferrer">
							<ExternalLink /> Ver loja
						</a>
					</Button>
					<DeleteButton
						resource="showcase"
						id={showcase.id}
						name={showcase.title}
						variant="button"
						redirectTo="/gerenciamento/vitrines"
					/>
				</PageHeader.Actions>
			</PageHeader.Root>
			<ShowcaseForm showcase={showcase} products={data.products} categories={data.categories} />
		</>
	);
}
