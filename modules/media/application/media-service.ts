import { ValidationError } from "@/modules/shared/domain/errors";
import {
	IMAGE_EXTENSIONS,
	MAX_IMAGE_BYTES,
	detectImageType,
	type MediaStorage,
	type StoredMedia,
} from "../domain/media";

function invalidFile(message: string): never {
	throw new ValidationError(message, { file: [message] });
}

export function createMediaService(storage: MediaStorage) {
	return {
		async uploadImage(bytes: Uint8Array): Promise<StoredMedia> {
			if (bytes.byteLength === 0) invalidFile("O arquivo está vazio.");
			if (bytes.byteLength > MAX_IMAGE_BYTES) {
				invalidFile("A imagem deve ter no máximo 5 MB.");
			}
			const contentType = detectImageType(bytes);
			if (!contentType) {
				invalidFile("Formato não suportado. Use JPG, PNG, WEBP, GIF ou AVIF.");
			}
			return storage.save({
				bytes,
				contentType,
				extension: IMAGE_EXTENSIONS[contentType],
			});
		},
	};
}

export type MediaService = ReturnType<typeof createMediaService>;
