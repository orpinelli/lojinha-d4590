"use client";

import type { CSSProperties, ReactNode } from "react";
import { useForm, useWatch, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Form } from "@/components/ui/form";
import { FormSubmitButton } from "@/components/admin/actions";
import { FormSection } from "@/components/admin/blocks";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { applyServerErrors } from "@/lib/form-errors";
import { themeToCssVariables } from "@/lib/theme";
import { settingsSectionSchemas } from "@/modules/settings/domain/site-settings-schemas";
import type {
	SettingsSection,
	SiteSettings,
	ThemeSettings,
} from "@/modules/settings/domain/site-settings";

/**
 * One card = one settings section saved independently. The schema is picked
 * on the client from `section` (schemas can't be passed from the server).
 */
export function SettingsFormRoot<S extends SettingsSection>({
	section,
	defaultValues,
	children,
}: {
	section: S;
	defaultValues: SiteSettings[S];
	children: ReactNode;
}) {
	const mutate = useAdminMutation();
	const schema = settingsSectionSchemas[section] as unknown as z.ZodType<FieldValues, FieldValues>;
	const form = useForm<FieldValues>({
		resolver: zodResolver(schema),
		defaultValues: defaultValues as FieldValues,
		mode: "onTouched",
	});

	const onSubmit = form.handleSubmit(async (values) => {
		await mutate(() => adminApi.updateSettings({ [section]: values }), {
			successMessage: "Alterações salvas. A loja já foi atualizada.",
			onSuccess: (settings) => form.reset(settings[section] as FieldValues),
			onError: (error) => applyServerErrors(form, error, `${section}.`),
		});
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} noValidate>
				<FormSection.Root>{children}</FormSection.Root>
			</form>
		</Form>
	);
}

export function SettingsFormSubmit() {
	return (
		<FormSection.Footer>
			<FormSubmitButton requireDirty>Salvar</FormSubmitButton>
		</FormSection.Footer>
	);
}

/** Live preview of the colors being edited (scoped CSS variables). */
export function ThemePreview() {
	const theme = useWatch() as Partial<ThemeSettings>;
	const style = {
		...themeToCssVariables(theme),
		"--primary-hover": "color-mix(in oklab, var(--primary) 86%, black)",
	} as CSSProperties;

	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">Pré-visualização</p>
			<div style={style} className="overflow-hidden rounded-lg border">
				<div className="space-y-3 bg-background p-4 text-foreground">
					<p className="text-xl font-light tracking-tight break-words">
						Título da loja <span className="font-extralight text-primary">Destaque</span>
					</p>
					<p className="text-sm text-muted-foreground">Texto secundário, descrições e legendas.</p>
					<div className="flex flex-wrap gap-2">
						<span className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground uppercase">
							Botão
						</span>
						<span className="inline-flex h-9 items-center rounded-md bg-primary-hover px-4 text-sm text-primary-foreground uppercase">
							Botão (hover)
						</span>
					</div>
				</div>
				<div className="bg-footer px-4 py-3 text-center text-xs text-footer-foreground">
					Rodapé da loja
				</div>
			</div>
		</div>
	);
}
