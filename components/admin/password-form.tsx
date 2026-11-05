"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import type { z } from "zod";
import { Form } from "@/components/ui/form";
import { FormSubmitButton } from "@/components/admin/actions";
import { FormSection } from "@/components/admin/blocks";
import { Field } from "@/components/admin/form-fields";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { applyServerErrors } from "@/lib/form-errors";
import { passwordChangeSchema } from "@/modules/auth/domain/auth-schemas";

type PasswordValues = z.input<typeof passwordChangeSchema>;

const EMPTY: PasswordValues = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
	const mutate = useAdminMutation();
	const form = useForm<PasswordValues>({
		resolver: zodResolver(passwordChangeSchema),
		defaultValues: EMPTY,
		mode: "onTouched",
	});

	const onSubmit = form.handleSubmit(async (values) => {
		await mutate(() => adminApi.changePassword(values), {
			successMessage: "Senha alterada. Use a nova senha no próximo login.",
			onSuccess: () => form.reset(EMPTY),
			onError: (error) => applyServerErrors(form, error),
		});
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} noValidate>
				<FormSection.Root>
					<FormSection.Header
						title="Trocar senha"
						description="Use pelo menos 10 caracteres, misturando letras, números e símbolos."
					/>
					<FormSection.Content>
						<Field.Text name="currentPassword" label="Senha atual" type="password" autoComplete="current-password" />
						<Field.Text name="newPassword" label="Nova senha" type="password" autoComplete="new-password" />
						<Field.Text name="confirmPassword" label="Repita a nova senha" type="password" autoComplete="new-password" />
					</FormSection.Content>
					<FormSection.Footer>
						<FormSubmitButton icon={<KeyRound />} pendingLabel="Trocando...">
							Trocar senha
						</FormSubmitButton>
					</FormSection.Footer>
				</FormSection.Root>
			</form>
		</Form>
	);
}
