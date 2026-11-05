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
