import { z } from "zod";

export const credentialsSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.max(254, "E-mail muito longo.")
		.pipe(z.email("Informe um e-mail válido.")),
	password: z
		.string()
		.min(1, "Informe a senha.")
		.max(200, "Senha muito longa."),
});

export const passwordChangeSchema = z
	.object({
		currentPassword: z.string().min(1, "Informe a senha atual.").max(200),
		newPassword: z
			.string()
			.min(10, "Use pelo menos 10 caracteres.")
			.max(72, "Use no máximo 72 caracteres."),
		confirmPassword: z.string(),
	})
	.refine((value) => value.newPassword === value.confirmPassword, {
		path: ["confirmPassword"],
		message: "As senhas não conferem.",
	})
	.refine((value) => value.newPassword !== value.currentPassword, {
		path: ["newPassword"],
		message: "A nova senha precisa ser diferente da atual.",
	});
