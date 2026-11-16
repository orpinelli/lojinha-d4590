import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN, E2E_PORT } from "./e2e/env";

/**
 * Browser tests (`npm run test:e2e`). They build and start the app on their own
 * in local mode (DATA_PROVIDER=local) with throwaway data in a temp folder and a
 * throwaway admin login: nothing touches Supabase or the real store.
 * Uses the installed Google Chrome (no browser download needed).
 */
export default defineConfig({
	testDir: "e2e",
	fullyParallel: false,
	workers: 1,
	reporter: [["list"]],
	timeout: 30_000,
	expect: { timeout: 7_000 },
	use: {
		baseURL: `http://localhost:${E2E_PORT}`,
		locale: "pt-BR",
		trace: "retain-on-failure",
	},
	projects: [
		{ name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
		{
			name: "celular",
			use: { ...devices["Pixel 7"], channel: "chrome" },
			// Admin and API checks don't depend on the screen size.
			testIgnore: /(admin|api)\.spec\.ts/,
		},
	],
	webServer: {
		command: `npm run build && npm run start -- --port ${E2E_PORT}`,
		url: `http://localhost:${E2E_PORT}/api/settings`,
		timeout: 300_000,
		reuseExistingServer: false,
		stdout: "ignore",
		stderr: "pipe",
		env: {
			DATA_PROVIDER: "local",
			LOCAL_STORAGE_DIR: path.join(os.tmpdir(), `lojinha-e2e-${process.pid}`),
			ADMIN_EMAIL: E2E_ADMIN.email,
			ADMIN_PASSWORD: E2E_ADMIN.password,
			AUTH_SECRET: "segredo-somente-para-testes-e2e-locais-0123456789",
		},
	},
});
