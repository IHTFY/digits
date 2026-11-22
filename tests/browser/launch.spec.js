import { test, expect } from '@playwright/test';

// Playwright can't open a page as an installed app, so the head script's display-mode query answers yes.
const installed = () => {
	const matchMedia = window.matchMedia.bind(window);
	window.matchMedia = (query) =>
		query.includes('display-mode')
			? /** @type {MediaQueryList} */ ({ matches: true, media: query })
			: matchMedia(query);
};

// Slow every animation and the head script's fallback tenfold, so a tap surely lands during the exit
// even on a loaded machine.
const slow = () => {
	const setTimeout = window.setTimeout;
	window.setTimeout = /** @type {typeof window.setTimeout} */ (
		(callback, delay = 0, ...args) => setTimeout(callback, delay * 10, ...args)
	);
	const animate = Element.prototype.animate;
	Element.prototype.animate = function (keyframes, options) {
		const animation = animate.call(this, keyframes, options);
		animation.playbackRate = 0.1;
		return animation;
	};
};

test('a touch during the launch only skips it, and the same touch afterward works', async ({
	browser
}) => {
	const context = await browser.newContext({
		hasTouch: true,
		viewport: { width: 390, height: 844 }
	});
	const page = await context.newPage();
	await page.addInitScript(installed);
	await page.addInitScript(slow);
	await page.goto('/');
	await page.waitForFunction(
		() => (document.getElementById('launch-fill')?.getAnimations().length ?? 0) > 0
	);
	const toggle = page.getByRole('button', { name: /^Switch to (dark|light) theme$/ });
	const label = await toggle.getAttribute('aria-label');
	const box = await toggle.boundingBox();
	if (!box) throw new Error('the theme switch has no box');
	const x = box.x + box.width / 2;
	const y = box.y + box.height / 2;
	expect(
		await page.evaluate(
			([x, y]) => document.elementFromPoint(x, y)?.closest('#launch') !== null,
			[x, y]
		)
	).toBe(true);

	await page.touchscreen.tap(x, y);
	await expect(page.locator('#launch')).toHaveCount(0, { timeout: 5000 });
	// A click that would reach the switch comes right after the tap.
	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 100)));
	await expect(toggle).toHaveAttribute('aria-label', /** @type {string} */ (label));
	await expect(page.locator('html')).not.toHaveClass(/launching/);

	await page.touchscreen.tap(x, y);
	await expect(toggle).not.toHaveAttribute('aria-label', /** @type {string} */ (label));
	await context.close();
});

test('a held mouse press during the launch only skips it, and the next click works', async ({
	page
}) => {
	await page.addInitScript(installed);
	await page.addInitScript(slow);
	await page.goto('/');
	await page.waitForFunction(
		() => (document.getElementById('launch-fill')?.getAnimations().length ?? 0) > 0
	);
	const toggle = page.getByRole('button', { name: /^Switch to (dark|light) theme$/ });
	const label = await toggle.getAttribute('aria-label');
	const box = await toggle.boundingBox();
	if (!box) throw new Error('the theme switch has no box');
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await expect(page.locator('#launch')).toHaveCount(0, { timeout: 5000 });
	// The copy is gone before the release, so this press may send no click at all.
	await page.mouse.up();
	await expect(toggle).toHaveAttribute('aria-label', /** @type {string} */ (label));

	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(toggle).not.toHaveAttribute('aria-label', /** @type {string} */ (label));
});
