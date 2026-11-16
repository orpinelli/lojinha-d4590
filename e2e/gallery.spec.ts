import { expect, test } from "@playwright/test";

/** Runs on desktop (mouse) and on a phone (touch), see playwright.config.ts. */
test("fotos do produto: zoom natural no mouse e em tela cheia", async ({ page, isMobile }) => {
	await page.goto("/product/10");
	const main = page.getByRole("button", { name: /^Ampliar foto 1 de \d+$/ });
	await expect(main).toBeVisible();

	if (!isMobile) {
		// The photo grows under the mouse and goes back when it leaves
		const box = await main.boundingBox();
		if (!box) throw new Error("foto sem tamanho");
		await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
		await expect(main.locator("[data-zoomed]")).toHaveCount(1);
		await page.mouse.move(box.x + box.width + 40, box.y - 40);
		await expect(main.locator("[data-zoomed]")).toHaveCount(0);
	}

	// Opens full screen on the chosen photo
	await page.getByRole("button", { name: "Ver imagem 2" }).click();
	await page.getByRole("button", { name: /^Ampliar foto 2 de \d+$/ }).click();
	const viewer = page.getByRole("dialog", { name: /^Fotos de / });
	await expect(viewer).toBeVisible();
	await expect(viewer.getByText(/^2 \/ \d+$/)).toBeVisible();

	// Double tap (phone) or double click (mouse) zooms in; the button zooms out
	const activeSlide = viewer.locator(".swiper-slide-active");
	const photo = activeSlide.locator("img");
	if (isMobile) {
		const box = await photo.boundingBox();
		if (!box) throw new Error("foto sem tamanho");
		const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
		await page.touchscreen.tap(x, y);
		await page.touchscreen.tap(x, y);
	} else {
		await photo.dblclick();
	}
	await expect(activeSlide).toHaveClass(/swiper-slide-zoomed/);
	await viewer.getByRole("button", { name: "Diminuir o zoom" }).click();
	await expect(activeSlide).not.toHaveClass(/swiper-slide-zoomed/);

	// Next photo (arrow with the mouse, keyboard otherwise), then close
	if (isMobile) await page.keyboard.press("ArrowRight");
	else await viewer.getByRole("button", { name: "Próxima foto" }).click();
	await expect(viewer.getByText(/^3 \/ \d+$/)).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(viewer).toBeHidden();
	// The page keeps showing the last photo seen
	await expect(page.getByRole("button", { name: /^Ampliar foto 3 de \d+$/ })).toBeVisible();
});
