import { PageHeader } from "@/components/admin/blocks";
import { ShowcaseForm } from "@/components/admin/showcase-form";
import { getRequestServices } from "@/lib/server/container";
import { loadShowcaseEditorData } from "@/lib/server/editor-data";
import { requireAdminSession } from "@/lib/server/session";

export default async function NewShowcasePage() {
	await requireAdminSession();
	const data = await loadShowcaseEditorData(await getRequestServices());

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Nova vitrine</PageHeader.Title>
					<PageHeader.Description>Ela entra no fim da página; depois é só arrastar na lista.</PageHeader.Description>
				</PageHeader.Content>
			</PageHeader.Root>
			<ShowcaseForm products={data.products} categories={data.categories} />
		</>
	);
}
