import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import {
	DomainError,
	ForbiddenError,
	UnauthorizedError,
	ValidationError,
	type DomainErrorCode,
	type FieldErrors,
} from "@/modules/shared/domain/errors";
import { getRequestServices } from "./container";

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
	VALIDATION: 422,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	RATE_LIMITED: 429,
	STORAGE_UNAVAILABLE: 503,
	CONFIGURATION: 500,
};

const NO_STORE = { "Cache-Control": "no-store" };

export type ApiError = {
	code: string;
	message: string;
	fieldErrors?: FieldErrors;
};

export function ok<T>(data: T, status = 200) {
	return NextResponse.json({ data }, { status, headers: NO_STORE });
}

export function noContent() {
	return new NextResponse(null, { status: 204, headers: NO_STORE });
}

export function errorResponse(error: unknown) {
	if (error instanceof DomainError) {
		const body: ApiError = { code: error.code, message: error.message };
		if (error instanceof ValidationError) body.fieldErrors = error.fieldErrors;
		return NextResponse.json(
			{ error: body },
			{ status: STATUS_BY_CODE[error.code], headers: NO_STORE },
		);
	}
	// Unexpected errors are logged server-side only; never leak internals.
	console.error("[api] unexpected error", error);
	return NextResponse.json(
		{
			error: {
				code: "INTERNAL",
				message: "Erro inesperado. Tente novamente em instantes.",
			},
		},
		{ status: 500, headers: NO_STORE },
	);
}

/** Wraps a route handler with uniform error handling. */
export function handle<TContext>(
	handler: (request: NextRequest, context: TContext) => Promise<Response>,
) {
	return async (request: NextRequest, context: TContext): Promise<Response> => {
		try {
			return await handler(request, context);
		} catch (error) {
			return errorResponse(error);
		}
	};
}

/**
 * Requiring `application/json` also blocks classic CSRF: cross-site HTML forms
 * cannot send JSON without a CORS preflight.
 */
const MAX_JSON_BYTES = 1024 * 1024;

export async function readJson(request: Request): Promise<unknown> {
	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		throw new ValidationError("Envie os dados no formato JSON.");
	}
	if (Number(request.headers.get("content-length") ?? 0) > MAX_JSON_BYTES) {
		throw new ValidationError("Dados grandes demais.");
	}
	try {
		return await request.json();
	} catch {
		throw new ValidationError("JSON inválido.");
	}
}

/** Rejects state-changing requests coming from another site. */
export function assertSameOrigin(request: NextRequest) {
	if (request.method === "GET" || request.method === "HEAD") return;
	const origin = request.headers.get("origin");
	if (!origin) return; // Non-browser clients (no ambient cookies to abuse).
	const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
	let originHost: string | null = null;
	try {
		originHost = new URL(origin).host;
	} catch {
		// handled below
	}
	if (!host || originHost !== host) {
		throw new ForbiddenError("Origem da requisição não permitida.");
	}
}

/** Same-origin + valid admin session; returns the request-scoped services. */
export async function requireAdmin(request: NextRequest) {
	assertSameOrigin(request);
	const services = await getRequestServices();
	const session = await services.auth.currentSession();
	if (!session) throw new UnauthorizedError();
	return { session, services };
}

/**
 * Best-effort client IP. `x-real-ip` is set by the hosting edge (Vercel) and
 * cannot be forged by the client; `x-forwarded-for` is only a fallback.
 */
export function clientIp(request: NextRequest): string {
	return (
		request.headers.get("x-real-ip")?.trim() ||
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		"unknown"
	);
}
