"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";

type MutationOptions<T> = {
	successMessage?: string;
	onSuccess?: (result: T) => void;
	/** Returns the message to show (e.g. after mapping field errors). */
	onError?: (error: unknown) => string;
};

/**
 * Single place for admin write feedback: success toast, refresh of server
 * data, error toast, and redirect to login when the session expired.
 */
export function useAdminMutation() {
	const router = useRouter();
	const { showToast } = useToast();

	return useCallback(
		async <T>(action: () => Promise<T>, options: MutationOptions<T> = {}) => {
			try {
				const result = await action();
				if (options.successMessage) {
					showToast({
						type: "success",
						title: "Pronto!",
						message: options.successMessage,
						duration: 3000,
					});
				}
				options.onSuccess?.(result);
				router.refresh();
				return { ok: true as const, result };
			} catch (error) {
				if (error instanceof ApiError && error.status === 401) {
					showToast({
						type: "warning",
						title: "Sessão expirada",
						message: "Entre novamente para continuar.",
						duration: 4000,
					});
					router.push(`/gerenciamento/login?next=${encodeURIComponent(window.location.pathname)}`);
					return { ok: false as const };
				}
				const message = options.onError
					? options.onError(error)
					: error instanceof ApiError
						? error.message
						: "Não foi possível concluir. Tente novamente.";
				showToast({ type: "error", title: "Algo deu errado", message, duration: 5000 });
				return { ok: false as const };
			}
		},
		[router, showToast],
	);
}
