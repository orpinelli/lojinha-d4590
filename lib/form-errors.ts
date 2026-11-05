import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ApiError } from "./api-client";

/**
 * Shows server-side validation errors on the matching form fields and returns
 * a message for a toast. `prefix` strips nested paths (e.g. "hero.").
 */
export function applyServerErrors<T extends FieldValues>(
	form: UseFormReturn<T>,
	error: unknown,
	prefix = "",
): string {
	if (!(error instanceof ApiError)) return "Não foi possível concluir. Tente novamente.";
	for (const [path, messages] of Object.entries(error.fieldErrors)) {
		const field = prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
		if (field && field !== "_form" && messages[0]) {
			form.setError(field as Path<T>, { type: "server", message: messages[0] });
		}
	}
	return error.message;
}
