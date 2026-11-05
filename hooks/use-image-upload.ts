"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { ApiError, adminApi } from "@/lib/api-client";
import { MAX_IMAGE_BYTES } from "@/modules/media/domain/media";

/** Uploads files one by one; failures are reported and skipped. */
export function useImageUpload() {
	const [uploading, setUploading] = useState(false);
	const { showToast } = useToast();

	const upload = useCallback(
		async (files: File[]): Promise<string[]> => {
			if (files.length === 0) return [];
			setUploading(true);
			const urls: string[] = [];
			try {
				for (const file of files) {
					if (file.size > MAX_IMAGE_BYTES) {
						showToast({
							type: "error",
							title: "Imagem muito grande",
							message: `"${file.name}" passa de 5 MB.`,
							duration: 5000,
						});
						continue;
					}
					try {
						urls.push((await adminApi.uploadImage(file)).url);
					} catch (error) {
						showToast({
							type: "error",
							title: "Falha no envio",
							message:
								error instanceof ApiError ? error.message : `Não foi possível enviar "${file.name}".`,
							duration: 5000,
						});
					}
				}
			} finally {
				setUploading(false);
			}
			return urls;
		},
		[showToast],
	);

	return { upload, uploading };
}
