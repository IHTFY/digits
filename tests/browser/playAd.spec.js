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
		await page.route('https://ihtfy.com/**', (route) => route.abort());
		await page.setViewportSize({ width, height });
		const withAd = await layout(page);
		expect(withAd.size).toBe(size);
		expect(withAd.scroll).toEqual([width, height]);
		if (size) expect(withAd.gap).toBeGreaterThanOrEqual(150);

		// A possible ad-free buyer gets no box and the same board.
		await page.addInitScript(() => localStorage.setItem('ihtfy-ad-free', 'token'));
		const buyer = await layout(page);
		expect(buyer.size).toBeNull();
		expect(buyer.board).toEqual(withAd.board);
	});
}
