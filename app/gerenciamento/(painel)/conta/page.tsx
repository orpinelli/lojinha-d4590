import { KeyRound } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/admin/blocks";
import { PasswordForm } from "@/components/admin/password-form";
import { getDataProviderName } from "@/lib/server/container";
import { requireAdminSession } from "@/lib/server/session";

export default async function AccountPage() {
	const session = await requireAdminSession();
	const isLocal = getDataProviderName() === "local";

	return (
		<>
			<PageHeader.Root>
				<PageHeader.Content>
					<PageHeader.Title>Minha conta</PageHeader.Title>
					<PageHeader.Description className="break-all">{session.email}</PageHeader.Description>
				</PageHeader.Content>
			</PageHeader.Root>

			<div className="max-w-xl">
				{isLocal ? (
					<EmptyState.Root>
						<EmptyState.Icon>
							<KeyRound />
						</EmptyState.Icon>
						<EmptyState.Title>Modo local</EmptyState.Title>
						<EmptyState.Description>
							Aqui a senha é a variável ADMIN_PASSWORD do arquivo .env.local.
						</EmptyState.Description>
					</EmptyState.Root>
				) : (
					<PasswordForm />
				)}
			</div>
		</>
	);
}
