import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toDomainError } from "@/modules/shared/infrastructure/supabase-errors";
import type { MediaStorage } from "../domain/media";

export const SUPABASE_MEDIA_BUCKET = "media";

/** Uploads to a public bucket; only admins can write (storage RLS policies). */
export function createSupabaseMediaStorage(client: SupabaseClient): MediaStorage {
	const bucket = () => client.storage.from(SUPABASE_MEDIA_BUCKET);

	return {
		async save({ bytes, contentType, extension }) {
			const objectPath = `uploads/${randomUUID()}.${extension}`;
			const { error } = await bucket().upload(objectPath, bytes, {
				contentType,
				cacheControl: "31536000",
				upsert: false,
			});
			if (error) {
				const status = Number((error as { statusCode?: string }).statusCode);
				throw toDomainError({ message: error.message, status });
			}
			return { url: bucket().getPublicUrl(objectPath).data.publicUrl };
		},
	};
}
