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
			([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest('#launch')),
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

// A touch held past the guard's old one-second timer, as in a long press, still makes its click on release.
test('a touch held for over a second during the launch is still covered when it lifts', async ({
	browser,
	browserName
}) => {
	test.skip(browserName !== 'chromium', 'only Chromium can hold a touch down and lift it later');
	const context = await browser.newContext({
		hasTouch: true,
		viewport: { width: 390, height: 844 }
	});
	const page = await context.newPage();
	await page.addInitScript(installed);
	// Only the animations slow down: the guard's timer must run at its real speed to show the bug.
	await page.addInitScript(() => {
		const animate = Element.prototype.animate;
		Element.prototype.animate = function (keyframes, options) {
			const animation = animate.call(this, keyframes, options);
			animation.playbackRate = 0.1;
			return animation;
		};
	});
	await page.goto('/');
	await page.waitForFunction(
		() => (document.getElementById('launch-fill')?.getAnimations().length ?? 0) > 0
	);
	const toggle = page.getByRole('button', { name: /^Switch to (dark|light) theme$/ });
	const label = await toggle.getAttribute('aria-label');
	const box = await toggle.boundingBox();
	if (!box) throw new Error('the theme switch has no box');
	const touchPoints = [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
	const cdp = await context.newCDPSession(page);

	await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
	await expect(page.locator('#launch')).toHaveCount(0, { timeout: 5000 });
	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1500)));
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
	await expect(toggle).toHaveAttribute('aria-label', /** @type {string} */ (label));

	// The guard drops a second after the release, so the same touch then works.
	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1200)));
	await page.touchscreen.tap(touchPoints[0].x, touchPoints[0].y);
	await expect(toggle).not.toHaveAttribute('aria-label', /** @type {string} */ (label));
	await context.close();
});

for (const next of ['click', 'key']) {
	test(`a held mouse press during the launch only skips it, and the next ${next} works`, async ({
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

		if (next === 'click') {
			await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
		} else {
			await toggle.focus();
			await page.keyboard.press('Enter');
		}
		await expect(toggle).not.toHaveAttribute('aria-label', /** @type {string} */ (label));
	});
}

// A press can start before the game calls launchExit, while its scripts still load: the guard is armed with
// the launching state, so the press only skips the launch, and its release over the switch changes nothing.
for (const input of ['touch', 'mouse']) {
	test(`a ${input} press made while the page loads only skips the launch`, async ({
		browser,
		browserName
	}) => {
		test.skip(
			input === 'touch' && browserName !== 'chromium',
			'only Chromium can hold a touch down and lift it later'
		);
		const context = await browser.newContext({
			hasTouch: input === 'touch',
			viewport: { width: 390, height: 844 },
			// A service worker would serve the scripts past the route that holds them back.
			serviceWorkers: 'block'
		});
		await context.addInitScript(installed);
		await context.addInitScript(slow);
		const page = await context.newPage();

		// Find the switch on a plain load first: the press goes there before it is drawn.
		await page.goto('/');
		const toggle = page.getByRole('button', { name: /^Switch to (dark|light) theme$/ });
		const label = await toggle.getAttribute('aria-label');
		const box = await toggle.boundingBox();
		if (!box) throw new Error('the theme switch has no box');
		const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

		// A fresh tab launches again; its scripts wait until the press is down.
		const loading = await context.newPage();
		await page.close();
		let release = () => {};
		const held = new Promise((resolve) => (release = resolve));
		await loading.route('**/*', async (route) => {
			if (route.request().resourceType() === 'script') await held;
			await route.fallback();
		});
		await loading.goto('/', { waitUntil: 'commit' });
		await loading.waitForFunction(() => document.documentElement.classList.contains('launching'));
		const cdp = input === 'touch' ? await context.newCDPSession(loading) : null;
		if (cdp) {
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
		} else {
			await loading.mouse.move(at.x, at.y);
			await loading.mouse.down();
		}
		release();
		await expect(loading.locator('#launch')).toHaveCount(0, { timeout: 10000 });
		const switchAgain = loading.getByRole('button', { name: /^Switch to (dark|light) theme$/ });
		await expect(switchAgain).toHaveAttribute('aria-label', /** @type {string} */ (label));
		if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
		else await loading.mouse.up();
		await loading.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
		await expect(switchAgain).toHaveAttribute('aria-label', /** @type {string} */ (label));

		// The guard drops a second after the release, so the next press works.
		await loading.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1200)));
		if (cdp) await loading.touchscreen.tap(at.x, at.y);
		else await loading.mouse.click(at.x, at.y);
		await expect(switchAgain).not.toHaveAttribute('aria-label', /** @type {string} */ (label));
		await context.close();
	});
}
