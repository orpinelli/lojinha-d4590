import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { StorageUnavailableError } from "@/modules/shared/domain/errors";
import { IMAGE_EXTENSIONS, type MediaStorage } from "../domain/media";

/** Public route that serves files saved by this adapter (app/media/[file]). */
export const LOCAL_MEDIA_ROUTE = "/media";

const FILE_NAME_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp|gif|avif)$/;
const CONTENT_TYPES = Object.fromEntries(
	Object.entries(IMAGE_EXTENSIONS).map(([type, extension]) => [extension, type]),
) as Record<string, string>;

export type LocalMediaStorage = MediaStorage & {
	read(
		fileName: string,
	): Promise<{ bytes: Uint8Array<ArrayBuffer>; contentType: string } | null>;
};

export function createLocalMediaStorage(directory: string): LocalMediaStorage {
	return {
		async save({ bytes, extension }) {
			const fileName = `${randomUUID()}.${extension}`;
			try {
				await mkdir(directory, { recursive: true });
				await writeFile(path.join(/*turbopackIgnore: true*/ directory, fileName), bytes);
			} catch (error) {
				const code = (error as { code?: string }).code;
				if (code === "EROFS" || code === "EACCES") {
					throw new StorageUnavailableError(
						"Este servidor não permite salvar arquivos. Configure o Supabase Storage.",
					);
				}
				throw error;
			}
			return { url: `${LOCAL_MEDIA_ROUTE}/${fileName}` };
		},

		async read(fileName) {
			// Strict allow-list: blocks path traversal ("../") and foreign files.
			if (!FILE_NAME_PATTERN.test(fileName)) return null;
			try {
				const bytes = await readFile(path.join(/*turbopackIgnore: true*/ directory, fileName));
				const extension = fileName.split(".").pop() ?? "";
				return { bytes: new Uint8Array(bytes), contentType: CONTENT_TYPES[extension] };
			} catch {
				return null;
			}
		},
	};
}
