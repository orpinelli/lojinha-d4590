"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormSubmitButton } from "@/components/admin/actions";
import { Field } from "@/components/admin/form-fields";
import { useAdminMutation } from "@/hooks/use-admin-mutation";
import { adminApi } from "@/lib/api-client";
import { applyServerErrors } from "@/lib/form-errors";
import { categoryInputSchema } from "@/modules/catalog/domain/catalog-schemas";
import type { CategoryInput } from "@/modules/catalog/domain/product";

type EditableCategory = { id: string; name: string; position: number };

/** Create (no `category`) or edit a category in a dialog. */
export function CategoryDialog({
	category,
	trigger,
}: {
	category?: EditableCategory;
	trigger: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const mutate = useAdminMutation();
	const form = useForm<CategoryInput>({
		resolver: zodResolver(categoryInputSchema),
		defaultValues: { name: category?.name ?? "", position: category?.position ?? 0 },
	});

	useEffect(() => {
		if (open) form.reset({ name: category?.name ?? "", position: category?.position ?? 0 });
	}, [open, category, form]);

	const onSubmit = form.handleSubmit(async (values) => {
		await mutate(
			() => (category ? adminApi.updateCategory(category.id, values) : adminApi.createCategory(values)),
			{
				successMessage: category ? "Categoria atualizada." : "Categoria criada.",
				onSuccess: () => setOpen(false),
				onError: (error) => applyServerErrors(form, error),
			},
		);
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
					<DialogDescription>Cada categoria vira uma seção e um item do menu da loja.</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={onSubmit} noValidate className="grid gap-5">
						<Field.Text name="name" label="Nome" placeholder="Ex.: Vestuário" maxLength={60} />
						<Field.Number
							name="position"
							label="Ordem"
							description="Números menores aparecem primeiro na loja."
						/>
						<DialogFooter>
							<DialogClose asChild>
								<Button type="button" variant="outline" className="h-10 hover:bg-muted hover:text-foreground">
									Cancelar
								</Button>
							</DialogClose>
							<FormSubmitButton>{category ? "Salvar" : "Criar categoria"}</FormSubmitButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
