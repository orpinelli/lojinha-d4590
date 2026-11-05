"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, LogOut, Save, Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { adminNavItemClass } from "@/components/admin/admin-shell/admin-shell";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** Submit button that follows the surrounding form state. */
export function FormSubmitButton({
	children = "Salvar",
	pendingLabel = "Salvando...",
	requireDirty = false,
	icon = <Save />,
	className,
}: {
	children?: ReactNode;
	pendingLabel?: string;
	requireDirty?: boolean;
	icon?: ReactNode;
	className?: string;
}) {
	const { formState } = useFormContext();
	const pending = formState.isSubmitting;
	return (
		<Button
			type="submit"
			disabled={pending || (requireDirty && !formState.isDirty)}
			className={cn("h-10 w-full sm:w-auto", className)}
		>
			{pending ? <Loader2 className="animate-spin" /> : icon}
			{pending ? pendingLabel : children}
		</Button>
	);
}

export function ConfirmDialog({
	trigger,
	title,
	description,
	confirmLabel = "Excluir",
	onConfirm,
}: {
	trigger: ReactNode;
	title: string;
	description: ReactNode;
	confirmLabel?: string;
	onConfirm: () => Promise<boolean>;
}) {
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState(false);

	const confirm = async (event: MouseEvent) => {
		event.preventDefault();
		setPending(true);
		const done = await onConfirm();
		setPending(false);
		if (done) setOpen(false);
	};

	return (
		<AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						onClick={confirm}
						disabled={pending}
						className="bg-destructive text-white hover:bg-destructive/90"
					>
						{pending && <Loader2 className="animate-spin" />}
						{pending ? "Excluindo..." : confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

const DELETABLE = {
	product: {
		title: "Excluir produto?",
		success: "Produto excluído.",
		remove: adminApi.deleteProduct,
	},
	category: {
		title: "Excluir categoria?",
		success: "Categoria excluída.",
		remove: adminApi.deleteCategory,
	},
	showcase: {
		title: "Excluir vitrine?",
		success: "Vitrine excluída.",
		remove: adminApi.deleteShowcase,
	},
} as const;

/** Delete with confirmation for any admin resource. */
export function DeleteButton({
	resource,
	id,
	name,
	redirectTo,
	variant = "icon",
}: {
	resource: keyof typeof DELETABLE;
	id: string;
	name: string;
	redirectTo?: string;
	variant?: "icon" | "button";
}) {
	const config = DELETABLE[resource];
	const mutate = useAdminMutation();
	const router = useRouter();

	return (
		<ConfirmDialog
			title={config.title}
			description={
				<>
					<strong className="break-words text-foreground">{name}</strong> será removido(a)
					permanentemente.
				</>
			}
			onConfirm={async () => {
				const { ok } = await mutate(() => config.remove(id), {
					successMessage: config.success,
					onSuccess: () => redirectTo && router.push(redirectTo),
				});
				return ok;
			}}
			trigger={
				variant === "icon" ? (
					<Button
						variant="ghost"
						aria-label={`Excluir ${name}`}
						className="size-10 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 className="size-4" />
					</Button>
				) : (
					<Button
						variant="outline"
						className="h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 /> Excluir
					</Button>
				)
			}
		/>
	);
}

export function LogoutButton() {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	const logout = async () => {
		setPending(true);
		try {
			await adminApi.logout();
		} finally {
			router.replace("/gerenciamento/login");
			router.refresh();
		}
	};

	return (
		<button
			type="button"
			onClick={logout}
			disabled={pending}
			className={cn(
				adminNavItemClass,
				"text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-60",
			)}
		>
			{pending ? <Loader2 className="animate-spin" /> : <LogOut />}
			<span>Sair</span>
		</button>
	);
}
