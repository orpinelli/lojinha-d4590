import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./env";

/** Logs in through the API; `page.request` shares the cookies with the page. */
export async function loginAsAdmin(request: APIRequestContext) {
	const response = await request.post("/api/auth/login", { data: E2E_ADMIN });
	expect(response.status(), "login do admin de teste").toBe(200);
}

/**
 * Blocks WhatsApp (no real chat is opened during tests) and records every URL
 * the store tried to open there.
 */
export async function captureWhatsapp(page: Page): Promise<string[]> {
	const opened: string[] = [];
	await page.context().route(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//, (route) => {
		opened.push(route.request().url());
		return route.fulfill({ status: 200, contentType: "text/html", body: "<p>WhatsApp</p>" });
	});
	return opened;
}

/** Text of the pre-filled WhatsApp message, with normal spaces (prices use a no-break space). */
export function whatsappText(url: string): string {
	return (new URL(url).searchParams.get("text") ?? "").replace(/\s/g, " ");
}

/** Puts items in the cart before the page loads (same format the store saves). */
export async function seedCart(
	page: Page,
	items: { productId: string; name: string; priceInCents: number; quantity: number; size?: string }[],
) {
	await page.addInitScript((saved) => {
		if (!sessionStorage.getItem("e2e-cart-seeded")) {
			localStorage.setItem("rotaract-cart", JSON.stringify(saved));
			sessionStorage.setItem("e2e-cart-seeded", "1");
		}
	}, items.map((item) => ({ image: "", ...item })));
}

/** Nothing may stick out sideways (the classic mobile bug). */
export async function expectNoHorizontalScroll(page: Page) {
	const { scrollWidth, width } = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		width: window.innerWidth,
	}));
	expect(scrollWidth, `largura da página em ${page.url()}`).toBeLessThanOrEqual(width);
}
