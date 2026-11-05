export type DomainErrorCode =
	| "VALIDATION"
	| "NOT_FOUND"
	| "CONFLICT"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "RATE_LIMITED"
	| "STORAGE_UNAVAILABLE"
	| "CONFIGURATION";

export type FieldErrors = Record<string, string[]>;

/**
 * Base for every expected failure. The HTTP layer maps `code` to a status,
 * so the domain never knows about HTTP.
 */
export class DomainError extends Error {
	readonly code: DomainErrorCode;

	constructor(code: DomainErrorCode, message: string) {
		super(message);
		this.code = code;
		this.name = new.target.name;
	}
}

export class ValidationError extends DomainError {
	readonly fieldErrors: FieldErrors;

	constructor(message: string, fieldErrors: FieldErrors = {}) {
		super("VALIDATION", message);
		this.fieldErrors = fieldErrors;
	}
}

export class NotFoundError extends DomainError {
	constructor(message = "Registro não encontrado.") {
		super("NOT_FOUND", message);
	}
}

export class ConflictError extends DomainError {
	constructor(message: string) {
		super("CONFLICT", message);
	}
}

export class UnauthorizedError extends DomainError {
	constructor(message = "Sua sessão expirou. Entre novamente.") {
		super("UNAUTHORIZED", message);
	}
}

export class ForbiddenError extends DomainError {
	constructor(message = "Você não tem permissão para esta ação.") {
		super("FORBIDDEN", message);
	}
}

export class RateLimitError extends DomainError {
	constructor(message = "Muitas tentativas. Aguarde alguns minutos.") {
		super("RATE_LIMITED", message);
	}
}

export class StorageUnavailableError extends DomainError {
	constructor(
		message = "Não foi possível salvar: o armazenamento está indisponível.",
	) {
		super("STORAGE_UNAVAILABLE", message);
	}
}

export class ConfigurationError extends DomainError {
	constructor(message: string) {
		super("CONFIGURATION", message);
	}
}
