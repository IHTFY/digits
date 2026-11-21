import { test, expect } from '@playwright/test';

// WebKit sends the page's requests through the service worker once it controls
// the page, and then page.route no longer sees them, so the real loader would load.
test.use({ serviceWorkers: 'block' });

/**
 * A stand-in for the loader: it records each show() and adds the "Remove ads"
 * link beside Privacy the way the real one does. No ad is requested.
 * @param {import('@playwright/test').Page} page
 */
async function stubLoader(page) {
	const loads = { count: 0 };
	await page.route('https://ihtfy.com/ads/v1.js', (route) => {
		loads.count++;
		return route.fulfill({
			contentType: 'text/javascript',
			body: `window.shown = [];
window.ihtfyAds = {
	show(box, key) {
		window.shown.push([box.dataset.adSlot, box.dataset.adSize, key]);
		const privacy = box.closest('aside').querySelector('a');
		const row = document.createElement('span');
		const link = privacy.cloneNode(false);
		link.href = 'https://ihtfy.com/ad-free';
		link.textContent = 'Remove ads';
		privacy.replaceWith(row);
		row.append(privacy, ' · ', link);
	},
	adFree: async () => !!localStorage.getItem('ihtfy-ad-free')
};`
		});
	});
	return loads;
}

/** @param {import('@playwright/test').Page} page */
async function finishTheDay(page) {
	await page.goto('/?adtest=on');
	await expect(page.locator('.target-number')).not.toBeEmpty();
	for (let index = 0; index < 5; index++) {
		await page.locator('.puzzle-tab').nth(index).click();
		await page.getByRole('button', { name: 'Show Solution' }).click();
	}
}

/**
 * Where the ad box and the results sit on the screen, and how far the box is from the nearest control.
 * @param {import('@playwright/test').Page} page
 */
const measure = (page) =>
	page.evaluate(() => {
		const box = document.querySelector('[data-ad-size]');
		const ad = box?.getBoundingClientRect();
		if (!box || !ad) throw new Error('no box');
		const inView = (/** @type {DOMRect} */ r) =>
			r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
		let gap = Infinity;
		for (const control of document.querySelectorAll('button, a, input, summary')) {
			if (!control.getClientRects().length) continue;
			const r = control.getBoundingClientRect();
			const dx = Math.max(r.left - ad.right, ad.left - r.right, 0);
			const dy = Math.max(r.top - ad.bottom, ad.top - r.bottom, 0);
			gap = Math.min(gap, Math.hypot(dx, dy));
		}
		const label = document.querySelector('aside p')?.getBoundingClientRect();
		return {
			size: [ad.width, ad.height],
			gap,
			boxInView: inView(ad),
			labelAboveBox: !!label && label.height > 0 && label.bottom <= ad.top && inView(label),
			headingInView: inView(document.querySelector('.results h2')?.getBoundingClientRect()),
			buttonInView: inView(document.querySelector('.results-review')?.getBoundingClientRect()),
			linksInView: [...document.querySelectorAll('aside a')].every(
				(link) => link.getClientRects().length > 0 && inView(link.getBoundingClientRect())
			),
			scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
			boxes: document.querySelectorAll('aside [data-ad-slot]:not(ins)').length,
			shown: window.shown
		};
	});

/**
 * The whole 300×250 box is on the screen without scrolling, clear of every control, with one ad asked for.
 * @param {import('@playwright/test').Page} page
 * @param {number} width
 * @param {number} height
 */
async function expectAdInView(page, width, height) {
	await expect(page.locator('[data-ad-size]')).toBeVisible();
	await page.waitForFunction(() => window.shown?.length === 1);
	await expect(page.locator('aside p')).toHaveText('Advertisements');
	const measured = await measure(page);
	expect(measured.size).toEqual([300, 250]);
	expect(measured.boxInView).toBe(true);
	expect(measured.labelAboveBox).toBe(true);
	expect(measured.headingInView).toBe(true);
	expect(measured.buttonInView).toBe(true);
	expect(measured.linksInView).toBe(true);
	expect(measured.scroll).toEqual([width, height]);
	expect(measured.gap).toBeGreaterThanOrEqual(50);
	expect(measured.boxes).toBe(1);
	expect(measured.shown).toHaveLength(1);
	expect(measured.shown[0].slice(0, 2)).toEqual(['6470163205', '300x250']);
}

/**
 * No box and none of its label or links show, the result and its button do, and the page does not scroll.
 * @param {import('@playwright/test').Page} page
 * @param {number} width
 * @param {number} height
 */
async function expectNoAdShowing(page, width, height) {
	await expect(page.locator('.results h2')).toBeInViewport({ ratio: 1 });
	await expect(page.locator('.results-review')).toBeInViewport({ ratio: 1 });
	await expect(page.locator('aside')).toBeHidden();
	expect(
		await page.evaluate(() => [
			document.documentElement.scrollWidth,
			document.documentElement.scrollHeight
		])
	).toEqual([width, height]);
}

const sizes = [
	[360, 640],
	[390, 750],
	[412, 800],
	[1280, 800],
	// The shortest phone that holds the whole stack.
	[360, 565]
];

for (const [width, height] of sizes) {
	test(`the results ad is fully in view at ${width}×${height}, 50 px from every control`, async ({
		page
	}) => {
		const loads = await stubLoader(page);
		await page.setViewportSize({ width, height });
		await finishTheDay(page);

		// Nothing is on the play screen, and nothing has loaded yet.
		await expect(page.locator('[data-ad-slot]')).toHaveCount(0);
		expect(loads.count).toBe(0);

		await expect(page.locator('.results')).toBeVisible();
		await expect(page.locator('[data-ad-size]')).toHaveCount(1);
		await expectAdInView(page, width, height);

		// Back to the puzzles: the box is removed, not hidden.
		await page.getByRole('button', { name: 'Review puzzles' }).click();
		await expect(page.locator('.results')).toHaveCount(0);
		await expect(page.locator('aside')).toHaveCount(0);
		await expect(page.locator('.board')).toBeVisible();
	});
}

for (const [width, height] of [
	[360, 640],
	[360, 740],
	[390, 844]
]) {
	test(`a ${width}×${height} phone turned on its side with the results open shows no ad below the screen`, async ({
		page
	}) => {
		await stubLoader(page);
		await page.setViewportSize({ width, height });
		await finishTheDay(page);
		await expect(page.locator('.results')).toBeVisible();
		await expectAdInView(page, width, height);

		// On its side the stack is taller than the screen, so the ad is left out.
		await page.setViewportSize({ width: height, height: width });
		await expectNoAdShowing(page, height, width);

		// Upright again the same box comes back, and no second ad is asked for.
		await page.setViewportSize({ width, height });
		await expectAdInView(page, width, height);
	});
}

for (const [width, height] of [
	[640, 360],
	[360, 564]
]) {
	test(`a ${width}×${height} screen, too short for the box, shows none and asks for the ad once the box fits`, async ({
		page
	}) => {
		const loads = await stubLoader(page);
		await page.setViewportSize({ width, height });
		await finishTheDay(page);
		await expect(page.locator('.results')).toBeVisible();
		await expectNoAdShowing(page, width, height);
		// A late request would show up by now: still none.
		await page.waitForTimeout(500);
		expect(loads.count).toBe(0);

		await page.setViewportSize({ width: 360, height: 640 });
		await expectAdInView(page, 360, 640);
	});
}

test('a buyer gets no box and no results-screen space for it', async ({ page }) => {
	await stubLoader(page);
	await page.addInitScript(() => localStorage.setItem('ihtfy-ad-free', 'token'));
	await page.setViewportSize({ width: 360, height: 640 });
	await finishTheDay(page);
	await expect(page.locator('.results')).toBeVisible();
	await expect(page.locator('aside')).toHaveCount(0);
	await expect(page.locator('[data-ad-slot]')).toHaveCount(0);
});

test('opening the page on a finished day shows no results screen and no box', async ({ page }) => {
	const loads = await stubLoader(page);
	await page.setViewportSize({ width: 360, height: 640 });
	await finishTheDay(page);
	await expect(page.locator('.results')).toBeVisible();
	await page.reload();
	await expect(page.locator('.target-number')).not.toBeEmpty();
	await page.waitForTimeout(1600);
	await expect(page.locator('.results')).toHaveCount(0);
	await expect(page.locator('[data-ad-slot]')).toHaveCount(0);
	expect(loads.count).toBe(1);
});
