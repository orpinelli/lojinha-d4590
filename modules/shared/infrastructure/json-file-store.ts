import "server-only";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { StorageUnavailableError } from "../domain/errors";

export interface JsonFileStore<T> {
	read(): Promise<T>;
	/** Applies `mutate` to a fresh copy and persists it atomically (serialized). */
	update<R>(mutate: (data: T) => R): Promise<R>;
}

const READ_ONLY_CODES = new Set(["EROFS", "EACCES"]);
const RETRYABLE_CODES = new Set(["EPERM", "EBUSY"]);

const errorCode = (error: unknown) =>
	typeof error === "object" && error !== null && "code" in error
		? String((error as { code: unknown }).code)
		: undefined;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tiny JSON "database" for local development. Missing files fall back to the
 * seed without writing, so read-only hosts still render the storefront.
 */
export function createJsonFileStore<T>({
	filePath,
	seed,
	normalize = (raw) => raw as T,
}: {
	filePath: string;
	seed: () => T;
	normalize?: (raw: unknown) => T;
}): JsonFileStore<T> {
	let queue: Promise<unknown> = Promise.resolve();

	async function load(): Promise<T> {
		try {
			return normalize(JSON.parse(await readFile(filePath, "utf8")));
		} catch (error) {
			if (errorCode(error) === "ENOENT") return normalize(seed());
			throw error;
		}
	}

	async function persist(data: T) {
		const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
		try {
			await mkdir(path.dirname(filePath), { recursive: true });
			await writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
			for (let attempt = 0; ; attempt++) {
				try {
					await rename(tempPath, filePath);
					return;
				} catch (error) {
					if (!RETRYABLE_CODES.has(errorCode(error) ?? "") || attempt >= 4) {
						throw error;
					}
					await wait(25 * (attempt + 1));
				}
			}
		} catch (error) {
			await rm(tempPath, { force: true }).catch(() => undefined);
			if (READ_ONLY_CODES.has(errorCode(error) ?? "")) {
				throw new StorageUnavailableError(
					"Este servidor não permite salvar arquivos. Configure o Supabase (DATA_PROVIDER=supabase).",
				);
			}
			throw error;
		}
	}

	return {
		read: load,
		update<R>(mutate: (data: T) => R): Promise<R> {
			const run = queue.then(async () => {
				const data = await load();
				const result = mutate(data);
				await persist(data);
				return result;
			});
			queue = run.catch(() => undefined);
			return run;
		},
	};
}
