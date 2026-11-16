import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

/**
 * Unit tests for the business rules (modules/ and lib/). Pure TypeScript: no
 * browser, database or Next.js runtime needed. Run with `npm test`.
 */
export default defineConfig({
	resolve: {
		alias: { "@": root },
	},
	test: {
		include: ["modules/**/*.test.ts", "lib/**/*.test.ts"],
		environment: "node",
		// Tests use the injected describe/it/expect instead of importing "vitest":
		// on Windows, a terminal opened on "c:" instead of "C:" would otherwise
		// load a second copy of it and no test would run.
		globals: true,
	},
});
