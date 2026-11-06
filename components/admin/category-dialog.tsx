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

/** Create (no `category`) or rename a category. Order is set by dragging. */
export function CategoryDialog({
	category,
	trigger,
}: {
	category?: { id: string; name: string };
	trigger: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const mutate = useAdminMutation();
	const form = useForm<CategoryInput>({
		resolver: zodResolver(categoryInputSchema),
		defaultValues: { name: category?.name ?? "" },
	});

	useEffect(() => {
		if (open) form.reset({ name: category?.name ?? "" });
	}, [open, category?.name, form]);

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
					<DialogDescription>
						Use as categorias para montar as vitrines da página inicial.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={onSubmit} noValidate className="grid gap-5">
						<Field.Text name="name" label="Nome" placeholder="Ex.: Camisetas" maxLength={60} />
						<DialogFooter>
							<DialogClose asChild>
								<Button type="button" variant="outline">
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
