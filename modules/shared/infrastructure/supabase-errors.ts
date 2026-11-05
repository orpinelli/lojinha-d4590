import {
	ConflictError,
	DomainError,
	ForbiddenError,
	RateLimitError,
	UnauthorizedError,
	ValidationError,
} from "../domain/errors";

type SupabaseLikeError = { code?: string; message: string; status?: number };

/** Translates Postgres/PostgREST/Storage errors into domain errors. */
export function toDomainError(error: SupabaseLikeError): Error {
	if (error instanceof DomainError) return error;
	switch (error.code) {
		case "23503":
			return new ConflictError("Este registro está ligado a outros dados.");
		case "23505":
			return new ConflictError("Já existe um registro com esses dados.");
		case "23514":
		case "22001":
			return new ValidationError("Os dados não atendem às regras do banco.");
		case "42501":
			return new ForbiddenError();
		case "PGRST301":
		case "PGRST302":
			return new UnauthorizedError();
	}
	if (error.status === 401) return new UnauthorizedError();
	if (error.status === 403) return new ForbiddenError();
	if (error.status === 413) {
		return new ValidationError("Arquivo maior que o permitido.");
	}
	if (error.status === 429) return new RateLimitError();
	return new Error(`Supabase: ${error.message}`);
}
