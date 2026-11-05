import type { NextRequest } from "next/server";
import { readLocalMedia } from "@/lib/server/container";

type Context = { params: Promise<{ file: string }> };

/** Serves uploads saved by the local storage adapter (development only). */
export async function GET(_request: NextRequest, { params }: Context) {
	const { file } = await params;
	const media = await readLocalMedia(file);
	if (!media) return new Response("Not found", { status: 404 });
	return new Response(media.bytes, {
		headers: {
			"Content-Type": media.contentType,
			"Cache-Control": "public, max-age=31536000, immutable",
			"X-Content-Type-Options": "nosniff",
			"Content-Security-Policy": "default-src 'none'; sandbox",
		},
	});
}
