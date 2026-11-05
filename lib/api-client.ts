import type {
	Category,
	CategoryInput,
	Product,
	ProductInput,
} from "@/modules/catalog/domain/product";
import type { SettingsPatch, SiteSettings } from "@/modules/settings/domain/site-settings";

export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly fieldErrors: Record<string, string[]>;

	constructor(
		message: string,
		status: number,
		code: string,
		fieldErrors: Record<string, string[]> = {},
	) {
		super(message);
		this.status = status;
		this.code = code;
		this.fieldErrors = fieldErrors;
	}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	let response: Response;
	try {
		response = await fetch(path, {
			...init,
			credentials: "same-origin",
			headers: { Accept: "application/json", ...init.headers },
		});
	} catch {
		throw new ApiError("Sem conexão com o servidor. Verifique sua internet.", 0, "NETWORK");
	}
	if (response.status === 204) return undefined as T;

	const body = await response.json().catch(() => null);
	if (!response.ok) {
		const error = body?.error;
		throw new ApiError(
			error?.message ?? "Erro inesperado. Tente novamente.",
			response.status,
			error?.code ?? "UNKNOWN",
			error?.fieldErrors,
		);
	}
	return body?.data as T;
}

const json = (method: string, data: unknown): RequestInit => ({
	method,
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(data),
});

const resource = (base: string, id: string) => `${base}/${encodeURIComponent(id)}`;

/** Typed client for the admin UI: components never call fetch directly. */
export const adminApi = {
	login: (credentials: { email: string; password: string }) =>
		request<{ email: string }>("/api/auth/login", json("POST", credentials)),
	logout: () => request<void>("/api/auth/logout", { method: "POST" }),

	createProduct: (input: ProductInput) =>
		request<Product>("/api/products", json("POST", input)),
	updateProduct: (id: string, input: ProductInput) =>
		request<Product>(resource("/api/products", id), json("PUT", input)),
	deleteProduct: (id: string) =>
		request<void>(resource("/api/products", id), { method: "DELETE" }),

	createCategory: (input: CategoryInput) =>
		request<Category>("/api/categories", json("POST", input)),
	updateCategory: (id: string, input: CategoryInput) =>
		request<Category>(resource("/api/categories", id), json("PUT", input)),
	deleteCategory: (id: string) =>
		request<void>(resource("/api/categories", id), { method: "DELETE" }),

	updateSettings: (patch: SettingsPatch) =>
		request<SiteSettings>("/api/settings", json("PATCH", patch)),

	uploadImage: (file: File) => {
		const body = new FormData();
		body.append("file", file);
		return request<{ url: string }>("/api/uploads", { method: "POST", body });
	},
};
