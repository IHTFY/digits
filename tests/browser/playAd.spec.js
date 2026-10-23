import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function layout(page) {
	await page.goto('/');
	await expect(page.locator('.target-number')).not.toBeEmpty();
	return page.evaluate(() => {
		const box = document.querySelector('[data-ad-size]');
		const board = document.querySelector('.board')?.getBoundingClientRect();
		let gap = Infinity;
		if (box) {
			const ad = box.getBoundingClientRect();
			for (const control of document.querySelectorAll('.app-shell button, .app-shell a, .board')) {
				const bounds = control.getBoundingClientRect();
				const dx = Math.max(bounds.left - ad.right, ad.left - bounds.right, 0);
				const dy = Math.max(bounds.top - ad.bottom, ad.top - bounds.bottom, 0);
				gap = Math.min(gap, Math.hypot(dx, dy));
			}
		}
		return {
			size: box?.getAttribute('data-ad-size') ?? null,
			gap,
			board: [board?.width, board?.height],
			scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight]
		};
	});
}

// WebKit sends the page's requests through the service worker once it controls
// the page, and then page.route no longer sees them, so the real loader would load.
test.use({ serviceWorkers: 'block' });

/** @type {[number, number, string | null][]} */
const sizes = [
	[1280, 800, null],
	[1536, 864, '160x600'],
	[1920, 1080, '300x600']
];

for (const [width, height, size] of sizes) {
	test(`the ad beside the game at ${width}×${height} keeps 150 px from it without shrinking it`, async ({
		page
	}) => {
		// A stand-in for the loader that accepts or rejects every ad-free token.
		let accept = true;
		await page.route('https://ihtfy.com/**', (route) =>
			route.fulfill({
				contentType: 'text/javascript',
				body: `window.ihtfyAds = { show() {}, adFree: async () => ${accept} };`
			})
		);
		await page.setViewportSize({ width, height });
		const withAd = await layout(page);
		expect(withAd.size).toBe(size);
		expect(withAd.scroll).toEqual([width, height]);
		if (size) expect(withAd.gap).toBeGreaterThanOrEqual(150);

		// An ad-free buyer gets no box and the same board, once the loader has checked the token too.
		await page.addInitScript(() => localStorage.setItem('ihtfy-ad-free', 'token'));
		const buyer = await layout(page);
		expect(buyer.size).toBeNull();
		expect(buyer.board).toEqual(withAd.board);
		await page.waitForFunction(() => window.ihtfyAds);
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		await expect(page.locator('[data-ad-size]')).toHaveCount(0);

		// A token the loader rejects brings the box back.
		accept = false;
		await page.reload();
		if (size) await expect(page.locator('[data-ad-size]')).toHaveAttribute('data-ad-size', size);
		else await expect(page.locator('[data-ad-size]')).toHaveCount(0);
	});
}
