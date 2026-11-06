"use client";

import type { CSSProperties, ReactNode } from "react";
import { useForm, useWatch, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormSubmitButton } from "@/components/admin/actions";
import { FormSection } from "@/components/admin/blocks";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { applyServerErrors } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
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
	// Derived tokens resolve where they are declared (:root), so they are
	// re-declared here to follow the scoped colors.
	const style = {
		...themeToCssVariables(theme),
		"--primary-hover": "color-mix(in oklab, var(--primary) 86%, black)",
		"--primary-shadow": "color-mix(in oklab, var(--primary) 80%, black)",
	} as CSSProperties;

	return (
		<div className="space-y-2">
			<p className="text-sm font-bold">Pré-visualização</p>
			<div style={style} className="overflow-hidden rounded-2xl border-2">
				<div className="space-y-3 bg-background p-4 text-foreground sm:p-5">
					<p className="font-display text-2xl leading-tight font-semibold break-words text-primary">
						Título da loja <span className="block text-foreground">Destaque</span>
					</p>
					<p className="text-sm text-muted-foreground">Texto secundário, descrições e legendas.</p>
					<div className="flex flex-wrap items-center gap-3 pb-1">
						<span className={buttonVariants({ size: "sm" })}>Botão</span>
						<span className={cn(buttonVariants({ size: "sm" }), "bg-primary-hover")}>Botão (hover)</span>
						<Badge>Etiqueta</Badge>
					</div>
				</div>
				<div className="bg-footer px-4 py-3 text-center text-xs font-bold tracking-[1px] text-footer-foreground uppercase">
					Rodapé da loja
				</div>
			</div>
		</div>
	);
}
