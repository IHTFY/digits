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
			combine(game, 1, 'times', 2);
			combine(game, 2, 'times', 3);
			combine(game, 3, 'times', 4);
			combine(game, 4, 'times', 5);
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
	await expect(page.getByRole('button', { name: '1', exact: true })).toBeHidden();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible();
	await expect(page.locator('.equation-row')).toHaveCount(0);
	await page.getByRole('button', { name: 'Reset puzzle', exact: true }).click();
	await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
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
	expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
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
