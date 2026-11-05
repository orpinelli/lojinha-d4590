import type { NextRequest } from "next/server";
import { MAX_IMAGE_BYTES } from "@/modules/media/domain/media";
import { ValidationError } from "@/modules/shared/domain/errors";
import { handle, ok, requireAdmin } from "@/lib/server/http";

const TOO_LARGE = "A imagem deve ter no máximo 5 MB.";

export const POST = handle(async (request: NextRequest) => {
	const { services } = await requireAdmin(request);

	// Reject oversized bodies before buffering them in memory.
	const declaredLength = Number(request.headers.get("content-length") ?? 0);
	if (declaredLength > MAX_IMAGE_BYTES + 64 * 1024) {
		throw new ValidationError(TOO_LARGE, { file: [TOO_LARGE] });
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		throw new ValidationError("Envie a imagem como multipart/form-data.");
	}
	const file = form.get("file");
	if (!(file instanceof File)) {
		throw new ValidationError("Selecione uma imagem.", {
			file: ["Selecione uma imagem."],
		});
	}
	if (file.size > MAX_IMAGE_BYTES) {
		throw new ValidationError(TOO_LARGE, { file: [TOO_LARGE] });
	}

	const media = await services.media.uploadImage(
		new Uint8Array(await file.arrayBuffer()),
	);
	return ok(media, 201);
});
