"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import type { z } from "zod";
import { Form } from "@/components/ui/form";
import { Field } from "@/components/admin/form-fields";
import { FormSubmitButton } from "@/components/admin/actions";
import { adminApi } from "@/lib/api-client";
import { applyServerErrors } from "@/lib/form-errors";
import { credentialsSchema } from "@/modules/auth/domain/auth-schemas";

type Credentials = z.input<typeof credentialsSchema>;

export function LoginForm({ redirectTo }: { redirectTo: string }) {
	const router = useRouter();
	const [formError, setFormError] = useState<string | null>(null);
	const form = useForm<Credentials>({
		resolver: zodResolver(credentialsSchema),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = form.handleSubmit(async (values) => {
		setFormError(null);
		try {
			await adminApi.login(values);
			router.replace(redirectTo);
			router.refresh();
		} catch (error) {
			setFormError(applyServerErrors(form, error));
			form.resetField("password");
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} noValidate className="grid gap-5">
				{formError && (
					<div
						role="alert"
						className="rounded-xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
					>
						{formError}
					</div>
				)}
				<Field.Text
					name="email"
					label="E-mail"
					type="email"
					inputMode="email"
					autoComplete="username"
					autoCapitalize="none"
				/>
				<Field.Text name="password" label="Senha" type="password" autoComplete="current-password" />
				<FormSubmitButton className="w-full sm:w-full" pendingLabel="Entrando..." icon={<LogIn />}>
					Entrar
				</FormSubmitButton>
			</form>
		</Form>
	);
}
