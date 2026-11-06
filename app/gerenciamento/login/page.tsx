import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormSection } from "@/components/admin/blocks";
import { LoginForm } from "@/components/admin/login-form";
import { getSiteSettings } from "@/lib/server/queries";
import { getAdminSession, safeAdminRedirect } from "@/lib/server/session";

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function LoginPage({ searchParams }: Props) {
	const { next } = await searchParams;
	const redirectTo = safeAdminRedirect(typeof next === "string" ? next : undefined);
	if (await getAdminSession()) redirect(redirectTo);
	const { branding } = await getSiteSettings();

	return (
		<div className="flex min-h-dvh items-center justify-center bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_12%,var(--background)),var(--background))] px-4 py-10">
			<div className="w-full max-w-sm">
				<div className="mb-6 flex flex-col items-center gap-4 text-center">
					<Image
						src={branding.logoUrl}
						alt={branding.storeName}
						width={180}
						height={60}
						priority
						className="h-12 w-auto max-w-[70%] object-contain"
					/>
					<div className="space-y-1">
						<h1 className="font-display text-3xl font-semibold text-foreground">Gerenciamento</h1>
						<p className="text-sm text-muted-foreground">Entre para editar a loja.</p>
					</div>
				</div>
				<FormSection.Root>
					<FormSection.Content className="py-6">
						<LoginForm redirectTo={redirectTo} />
					</FormSection.Content>
				</FormSection.Root>
				<p className="mt-6 text-center text-sm">
					<Link href="/" className="text-[13px] font-extrabold tracking-[0.5px] text-link uppercase underline-offset-4 hover:underline">
						← Voltar para a loja
					</Link>
				</p>
			</div>
		</div>
	);
}
