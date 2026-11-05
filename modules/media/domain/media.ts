export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_EXTENSIONS = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
} as const;

export type ImageMimeType = keyof typeof IMAGE_EXTENSIONS;

/** Value for `<input type="file" accept>`; SVG is intentionally excluded (XSS). */
export const ACCEPTED_IMAGE_TYPES = Object.keys(IMAGE_EXTENSIONS).join(",");

/**
 * Identifies the real format from the file signature ("magic bytes") instead of
 * trusting the browser-provided MIME type or file name.
 */
export function detectImageType(bytes: Uint8Array): ImageMimeType | null {
	const matches = (signature: number[], offset = 0) =>
		signature.every((byte, index) => bytes[offset + index] === byte);

	if (matches([0xff, 0xd8, 0xff])) return "image/jpeg";
	if (matches([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
		return "image/png";
	}
	if (matches([0x47, 0x49, 0x46, 0x38])) return "image/gif";
	if (matches([0x52, 0x49, 0x46, 0x46]) && matches([0x57, 0x45, 0x42, 0x50], 8)) {
		return "image/webp";
	}
	if (matches([0x66, 0x74, 0x79, 0x70], 4)) {
		const brand = String.fromCharCode(...bytes.subarray(8, 12));
		if (brand === "avif" || brand === "avis") return "image/avif";
	}
	return null;
}

export type MediaUpload = {
	bytes: Uint8Array;
	contentType: ImageMimeType;
	extension: string;
};

export type StoredMedia = { url: string };

/** Port: local disk in development, Supabase Storage in production. */
export interface MediaStorage {
	save(file: MediaUpload): Promise<StoredMedia>;
}
