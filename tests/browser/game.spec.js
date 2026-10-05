import { test, expect } from '@playwright/test';
import { createStep, combine } from '../../src/lib/game.js';

const sizes = [
	[320, 568],
	[360, 640],
	[375, 667],
	[390, 844],
	[430, 932],
	[568, 320],
	[667, 375],
	[844, 390],
	[640, 480],
	[768, 1024],
	[820, 1180],
	[1024, 768],
	[1280, 800],
	[1366, 768],
	[1920, 1080],
	[2560, 1440]
];

function fixture() {
	const numList = [1, 2, 4, 5, 10, 25];
	return {
		numList,
		target: 72,
		stars: 0,
		distance: 47,
		history: [createStep(numList)],
		revealed: false,
		solution: ['25 − 1 = 24', '5 − 2 = 3', '24 × 3 = 72']
	};
}

/** @param {import('@playwright/test').Page} page @param {ReturnType<typeof fixture>} game */
async function openGame(page, game = fixture()) {
	await page.addInitScript((game) => {
		const date = new Date();
		const key = date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
		if (!localStorage.getItem(String(key))) {
			localStorage.setItem(String(key), JSON.stringify(Array.from({ length: 5 }, () => game)));
		}
	}, game);
	await page.goto('/');
	await expect(page.locator('.target-number')).toHaveText('72');
}

for (const revealed of [false, true]) {
	for (const [width, height] of sizes) {
		test(`full history fits ${width}×${height}, solution ${revealed ? 'visible' : 'hidden'}`, async ({
			page
		}) => {
			const game = fixture();
			combine(game, 0, 'plus', 1);
			combine(game, 0, 'times', 2);
			combine(game, 0, 'times', 3);
			combine(game, 0, 'times', 4);
			combine(game, 0, 'times', 5);
			game.revealed = revealed;
			await page.setViewportSize({ width, height });
			await openGame(page, game);
			await expect(page.locator('.equation-row')).toHaveCount(5);
			const result = await page.evaluate(() => {
				const outside = [
					...document.querySelectorAll(
						'.app-shell button, .app-shell summary, .equation-row, .distance-row'
					)
				]
					.filter((element) => element.checkVisibility())
					.filter((element) => {
						const bounds = element.getBoundingClientRect();
						return (
							bounds.left < -0.5 ||
							bounds.top < -0.5 ||
							bounds.right > innerWidth + 0.5 ||
							bounds.bottom > innerHeight + 0.5
						);
					})
					.map((element) => element.textContent?.trim() || element.getAttribute('aria-label'));
				const sections = [
					...document.querySelectorAll(
						'.puzzle-tabs, .number-grid, .operator-grid, .progress-section, .operations-section'
					)
				];
				const overlaps = [];
				for (let a = 0; a < sections.length; a++)
					for (let b = a + 1; b < sections.length; b++) {
						const x = sections[a].getBoundingClientRect(),
							y = sections[b].getBoundingClientRect();
						if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top)
							overlaps.push([sections[a].className, sections[b].className]);
					}
				return {
					outside,
					overlaps,
					width: document.documentElement.scrollWidth,
					height: document.documentElement.scrollHeight
				};
			});
			expect(result).toEqual({ outside: [], overlaps: [], width, height });
		});
	}
}

test('merge animation commits once, then undo and reset restore numbers', async ({ page }) => {
	await openGame(page);
	await page.getByRole('button', { name: '1', exact: true }).click();
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await page.getByRole('button', { name: '2', exact: true }).click();
	await expect(page.getByRole('button', { name: '3', exact: true })).toBeVisible();
	await expect(page.locator('.equation-row')).toHaveCount(1);
	await expect(page.getByRole('button', { name: '2', exact: true })).toBeHidden();
	await expect(page.locator('.number-button').first()).toHaveAttribute('aria-label', '3');
	await expect(page.locator('.number-button').first()).toHaveText('3');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible();
	await expect(page.locator('.equation-row')).toHaveCount(0);
	await page.getByRole('button', { name: 'Reset puzzle', exact: true }).click();
	await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
});

test('B travels to A before A rolls to the subtraction result', async ({ page }) => {
	await openGame(page);
	await page.getByRole('button', { name: '10', exact: true }).click();
	await page.getByRole('button', { name: 'Subtract', exact: true }).click();
	await page.clock.install({ time: new Date('2026-10-01T12:00:00Z') });
	await page.clock.pauseAt(new Date('2026-10-01T12:00:01Z'));
	const travel = await page.evaluate(() => {
		const buttons = /** @type {NodeListOf<HTMLButtonElement>} */ (
			document.querySelectorAll('.number-button')
		);
		const a = buttons[4].getBoundingClientRect();
		const b = buttons[1].getBoundingClientRect();
		buttons[1].click();
		const animation = buttons[1].getAnimations()[0];
		animation.pause();
		return {
			transform:
				animation.effect instanceof KeyframeEffect
					? animation.effect.getKeyframes().at(-1)?.transform
					: null,
			expectedX: a.x - b.x,
			expectedY: a.y - b.y,
			aAnimations: buttons[4]
				.getAnimations()
				.filter(
					(animation) =>
						animation.effect instanceof KeyframeEffect &&
						animation.effect.getKeyframes().some((frame) => frame.transform)
				).length
		};
	});
	const translation = String(travel.transform).match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
	expect(translation).not.toBeNull();
	expect(Number(translation?.[1])).toBeCloseTo(travel.expectedX, 2);
	expect(Number(translation?.[2])).toBeCloseTo(travel.expectedY, 2);
	expect(travel.aAnimations).toBe(0);
	await expect(page.locator('.equation-row')).toHaveCount(0);
	await page.evaluate(() =>
		document.querySelectorAll('.number-button')[1].getAnimations()[0].finish()
	);
	await page.clock.runFor(80);
	await expect(page.locator('.number-button').nth(4)).toHaveText('9');
	await expect(page.locator('.puzzle')).toHaveAttribute('aria-busy', 'true');
	await expect(page.locator('.equation-row')).toHaveCount(0);
	await page.clock.runFor(300);
	await expect(page.locator('.number-button').nth(4)).toHaveAttribute('aria-label', '8');
	await expect(page.locator('.number-button').nth(4)).toHaveText('8');
	await expect(page.locator('.number-button').nth(1)).toBeHidden();
	await expect(page.locator('.puzzle').getByRole('status')).toHaveText('8');
});

test('switching puzzles during the result tween cancels the uncommitted operation', async ({
	page
}) => {
	await openGame(page);
	await page.getByRole('button', { name: '25', exact: true }).click();
	await page.getByRole('button', { name: 'Multiply', exact: true }).click();
	await page.clock.install({ time: new Date('2026-10-01T12:00:00Z') });
	await page.clock.pauseAt(new Date('2026-10-01T12:00:01Z'));
	await page.evaluate(() => {
		const button = document.querySelectorAll('.number-button')[4];
		if (button instanceof HTMLButtonElement) {
			button.click();
			button.getAnimations()[0].finish();
		}
	});
	await page.clock.runFor(80);
	const current = Number(await page.locator('.number-button').nth(5).innerText());
	expect(current).toBeGreaterThan(25);
	expect(current).toBeLessThan(250);
	await expect(page.locator('.puzzle')).toHaveAttribute('aria-busy', 'true');
	await page.evaluate(() => {
		const tab = document.querySelectorAll('.puzzle-tab')[1];
		if (tab instanceof HTMLButtonElement) tab.click();
	});
	await page.clock.runFor(16);
	await page.evaluate(() => {
		const tab = document.querySelector('.puzzle-tab');
		if (tab instanceof HTMLButtonElement) tab.click();
	});
	await page.clock.runFor(400);
	await expect(page.locator('.number-button').nth(5)).toHaveText('25');
	await expect(page.locator('.equation-row')).toHaveCount(0);
	await expect(page.locator('.puzzle')).toHaveAttribute('aria-busy', 'false');
});

test('switching puzzles during a merge cancels it without corrupting history', async ({ page }) => {
	await openGame(page);
	await page.getByRole('button', { name: '1', exact: true }).click();
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await page.evaluate(() => {
		const second = document.querySelectorAll('.number-button')[1];
		const tab = document.querySelectorAll('.puzzle-tab')[1];
		if (second instanceof HTMLButtonElement) second.click();
		if (tab instanceof HTMLButtonElement) tab.click();
	});
	await page.locator('.puzzle-tab').first().click();
	await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible();
	await expect(page.locator('.equation-row')).toHaveCount(0);
	await expect(page.locator('.puzzle')).toHaveAttribute('aria-busy', 'false');
});

test('reduced motion skips circle travel', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await openGame(page);
	await page.getByRole('button', { name: '1', exact: true }).click();
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await page.getByRole('button', { name: '2', exact: true }).click();
	await expect(page.getByRole('button', { name: '3', exact: true })).toBeVisible();
	await expect(page.locator('.number-button').first()).toHaveAttribute('aria-label', '3');
	await expect(page.locator('.number-button').nth(1)).toBeHidden();
	expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('the target counts through intermediate values across all five puzzles', async ({ page }) => {
	await openGame(page);
	await page.evaluate(() => {
		const date = new Date();
		const key = `digits:${date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()}`;
		const games = JSON.parse(localStorage.getItem(key) || '[]');
		[72, 128, 205, 304, 450].forEach((target, index) => (games[index].target = target));
		localStorage.setItem(key, JSON.stringify(games));
	});
	await page.reload();
	await expect(page.locator('.target-number')).toHaveText('72');
	await page.clock.install({ time: new Date('2026-10-01T12:00:00Z') });
	await page.clock.pauseAt(new Date('2026-10-01T12:00:01Z'));
	const selectTab = async (/** @type {number} */ index) => {
		await page.evaluate((index) => {
			const tab = document.querySelectorAll('.puzzle-tab')[index];
			if (tab instanceof HTMLButtonElement) tab.click();
		}, index);
	};
	await selectTab(1);
	await page.clock.runFor(80);
	const intermediate = Number(await page.locator('.target-number').innerText());
	expect(intermediate).toBeGreaterThan(72);
	expect(intermediate).toBeLessThan(128);
	// Interrupt this tween with another tab and count from the current value.
	await selectTab(2);
	await page.clock.runFor(300);
	await expect(page.locator('.target-number')).toHaveText('205');
	for (const [index, target] of [
		[3, 304],
		[4, 450],
		[0, 72],
		[1, 128]
	]) {
		await selectTab(index);
		await page.clock.runFor(300);
		await expect(page.locator('.target-number')).toHaveText(String(target));
	}
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await selectTab(0);
	await expect(page.locator('.target-number')).toHaveText('72');
});

test('theme and revealed solution persist, and instructions support Escape', async ({ page }) => {
	await openGame(page);
	await page.getByRole('button', { name: 'Switch to dark theme' }).click();
	await page.getByRole('button', { name: 'Show Solution' }).click();
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(page.getByText('Our Solution', { exact: true })).toBeVisible();
	await page.getByLabel('Menu', { exact: true }).click();
	await page.getByRole('button', { name: 'How to Play' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('unavailable storage does not prevent playing', async ({ page }) => {
	await page.addInitScript(() => {
		Storage.prototype.getItem = () => {
			throw new Error('Storage blocked');
		};
		Storage.prototype.setItem = () => {
			throw new Error('Storage blocked');
		};
	});
	await page.goto('/');
	await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
	await page.getByRole('button', { name: 'Reset puzzle' }).click();
	await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
});

test('the production game reloads offline after the service worker is ready', async ({
	page,
	context,
	browserName
}) => {
	test.skip(
		browserName === 'webkit',
		'WebKit offline emulation rejects service worker navigation: https://github.com/microsoft/playwright/issues/42775'
	);
	await openGame(page);
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.reload();
	await expect(page.locator('.target-number')).toHaveText('72');
	await context.setOffline(true);
	await page.reload();
	await expect(page.locator('.target-number')).toHaveText('72');
	await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
});

test('the web manifest is installable with a maskable icon that exists', async ({
	page,
	request
}) => {
	await page.goto('/');
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	const manifest = await (await request.get(new URL(href ?? '', page.url()).href)).json();
	expect(manifest.display).toBe('standalone');
	expect(manifest.icons.map((/** @type {{purpose: string}} */ icon) => icon.purpose)).toContain(
		'maskable'
	);
	for (const icon of manifest.icons) {
		const response = await request.get(new URL(icon.src, new URL(href ?? '', page.url())).href);
		expect(response.ok()).toBe(true);
	}
});

test('the service worker keeps updates waiting until the player accepts them', async ({
	page,
	browserName
}) => {
	test.skip(browserName === 'webkit', 'Service worker setup differs in WebKit offline testing');
	await openGame(page);
	const registration = await page.evaluate(async () => {
		const reg = await navigator.serviceWorker.ready;
		return { scope: reg.scope, active: !!reg.active };
	});
	expect(registration.active).toBe(true);
	await expect(page.locator('.update-prompt')).toHaveCount(0);
});

for (const [width, height] of [
	[320, 568],
	[375, 667],
	[390, 844],
	[568, 320],
	[667, 375],
	[768, 1024],
	[1440, 900]
]) {
	test(`controls stay fixed throughout merges at ${width}×${height}`, async ({ page }) => {
		await page.setViewportSize({ width, height });
		await openGame(page);
		await page.getByRole('button', { name: '1', exact: true }).click();
		await page.getByRole('button', { name: 'Add', exact: true }).click();
		const samples = await page.evaluate(async () => {
			const selectors =
				'.target-number, .number-slot, .number-slot:not(:nth-child(2)) .number-button, .operator-button, .progress-section, .operations-section';
			const measure = () =>
				[...document.querySelectorAll(selectors)].map((element) => {
					const { x, y, width, height } = element.getBoundingClientRect();
					return [x, y, width, height];
				});
			const before = measure();
			const during = [];
			const second = document.querySelectorAll('.number-button')[1];
			if (second instanceof HTMLButtonElement) second.click();
			const start = performance.now();
			while (performance.now() - start < 650) {
				await new Promise(requestAnimationFrame);
				during.push(measure());
			}
			return { before, during };
		});
		for (const sample of samples.during) {
			for (let element = 0; element < sample.length; element++) {
				for (let axis = 0; axis < 4; axis++) {
					expect(Math.abs(sample[element][axis] - samples.before[element][axis])).toBeLessThan(0.5);
				}
			}
		}
		await expect(page.getByRole('button', { name: '3', exact: true })).toBeVisible();
		const after = await page.locator('.operator-grid').boundingBox();
		await page.getByRole('button', { name: 'Undo', exact: true }).click();
		expect(await page.locator('.operator-grid').boundingBox()).toEqual(after);
		await page.getByRole('button', { name: 'Show Solution' }).click();
		expect(await page.locator('.operator-grid').boundingBox()).toEqual(after);
	});
}

for (const [width, height] of [
	[375, 667],
	[667, 375],
	[1440, 900]
]) {
	test(`menu links and button align at ${width}×${height}`, async ({ page }) => {
		await page.setViewportSize({ width, height });
		await openGame(page);
		await page.getByLabel('Menu', { exact: true }).click();
		await page.locator('#navigation-menu').evaluate(async (element) => {
			await Promise.all(element.getAnimations().map((animation) => animation.finished));
		});
		const rows = await page.locator('.dropdown li > :is(a, button)').evaluateAll((elements) =>
			elements.map((element) => {
				const bounds = element.getBoundingClientRect();
				const icon = element.querySelector('svg')?.getBoundingClientRect();
				const text = [...element.childNodes].find(
					(node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
				);
				const range = document.createRange();
				if (text) range.selectNode(text);
				return {
					x: bounds.x,
					width: bounds.width,
					height: bounds.height,
					iconX: icon?.x,
					iconOffsetY: icon ? icon.y - bounds.y : null,
					textX: range.getBoundingClientRect().x
				};
			})
		);
		expect(rows).toHaveLength(4);
		for (const row of rows) {
			Object.values(row).forEach((value, index) => {
				expect(Math.abs(Number(value) - Number(Object.values(rows[0])[index]))).toBeLessThan(0.1);
			});
		}
	});
}

for (const reducedMotion of /** @type {const} */ (['no-preference', 'reduce'])) {
	test(`menu dismisses and instructions restore focus with ${reducedMotion} motion`, async ({
		page
	}) => {
		await page.emulateMedia({ reducedMotion });
		await openGame(page);
		const menu = page.getByRole('button', { name: 'Menu', exact: true });
		const panel = page.locator('#navigation-menu');
		await menu.click();
		await expect(menu).toHaveAttribute('aria-expanded', 'true');
		await expect(panel).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(panel).toBeHidden();
		await expect(menu).toBeFocused();
		await menu.click();
		await page.locator('.target-number').click();
		await expect(panel).toBeHidden();
		await menu.click();
		await page.getByRole('button', { name: 'How to Play' }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
		await expect(panel).toBeHidden();
		await page.getByRole('button', { name: 'Play', exact: true }).click();
		await expect(page.getByRole('dialog')).toBeHidden();
		await expect(menu).toBeFocused();
		await expect(menu).toHaveAttribute('aria-expanded', 'false');
	});
}

for (const [width, height] of [
	[320, 568],
	[667, 375],
	[1440, 900]
]) {
	test(`visual instructions fit and scroll at ${width}×${height}`, async ({ page }) => {
		await page.setViewportSize({ width, height });
		await openGame(page);
		await page.getByRole('button', { name: 'Menu', exact: true }).click();
		await page.getByRole('button', { name: 'How to Play' }).click();
		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Reach the target' })).toBeVisible();
		await page.getByRole('button', { name: 'Play', exact: true }).scrollIntoViewIfNeeded();
		expect(
			await dialog.evaluate((element) => ({
				overflow: element.scrollWidth > element.clientWidth,
				inside: element.getBoundingClientRect().bottom <= innerHeight
			}))
		).toEqual({ overflow: false, inside: true });
		await page.getByRole('button', { name: 'Close instructions' }).click();
		await expect(dialog).toBeHidden();
	});
}
