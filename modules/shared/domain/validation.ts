import { z } from "zod";
import { ValidationError, type FieldErrors } from "./errors";

/** Local public path ("/produtos/x.png") or absolute https URL (Supabase Storage). */
export const assetUrlSchema = z
	.string()
	.trim()
	.min(1, "Envie uma imagem.")
	.max(2048, "Endereço da imagem muito longo.")
	.refine(
		(value) =>
			(value.startsWith("/") && !value.startsWith("//")) ||
			isHttpsUrl(value),
		"Use um caminho local (/...) ou um endereço https://.",
	);

export const hexColorSchema = z
	.string()
	.trim()
	.regex(/^#[0-9a-fA-F]{6}$/, "Use o formato #RRGGBB.");

export const optionalHttpsUrlSchema = z
	.string()
	.trim()
	.max(2048, "Endereço muito longo.")
	.refine(
		(value) => value === "" || isHttpsUrl(value),
		"Informe um endereço começando com https://.",
	);

function isHttpsUrl(value: string): boolean {
	try {
		return new URL(value).protocol === "https:";
	} catch {
		return false;
	}
}

export function toFieldErrors(error: z.ZodError): FieldErrors {
	const fieldErrors: FieldErrors = {};
	for (const issue of error.issues) {
		const key = issue.path.map(String).join(".") || "_form";
		(fieldErrors[key] ??= []).push(issue.message);
	}
	return fieldErrors;
}

/** Validates untrusted input at the application boundary. */
export function parseInput<TSchema extends z.ZodType>(
	schema: TSchema,
	input: unknown,
): z.output<TSchema> {
	const result = schema.safeParse(input);
	if (!result.success) {
		throw new ValidationError(
			"Confira os campos destacados.",
			toFieldErrors(result.error),
		);
	}
	return result.data;
}
