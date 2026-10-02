import { test, expect } from '@playwright/test';
import { createStep, combine } from '../../src/lib/game.js';

test('legacy progress migrates to a namespaced calendar key and wins on later reloads', async ({
	page
}) => {
	await page.clock.install({ time: new Date(2026, 9, 1, 12) });
	const numList = [1, 2, 4, 5, 10, 25];
	const game = {
		numList,
		target: 72,
		stars: 0,
		distance: 47,
		history: [createStep(numList)],
		solution: ['25 - 1 = 24', '5 - 2 = 3', '24 × 3 = 72'],
		revealed: false
	};
	combine(game, 0, 'plus', 1);
	await page.addInitScript((game) => {
		if (!localStorage.getItem('20260901')) {
			localStorage.setItem('20260901', JSON.stringify(Array.from({ length: 5 }, () => game)));
			// An old November save occupies the corrected October numeric key.
			localStorage.setItem('20261001', 'do not overwrite');
		}
	}, game);
	await page.goto('/');
	await expect(page.locator('.target-number')).toHaveText('72');
	await expect(page.locator('.equation-row')).toHaveCount(1);
	await page.getByRole('button', { name: 'Show Solution' }).click();
	await page.reload();
	await expect(page.getByText('Our Solution', { exact: true })).toBeVisible();
	await expect(page.locator('.equation-row')).toHaveCount(3);
	const saved = await page.evaluate(() => ({
		current: JSON.parse(localStorage.getItem('digits:20261001') || 'null'),
		legacy: JSON.parse(localStorage.getItem('20260901') || 'null'),
		otherMonth: localStorage.getItem('20261001')
	}));
	expect(saved.current[0].revealed).toBe(true);
	expect(saved.legacy[0].revealed).toBe(false);
	expect(saved.otherMonth).toBe('do not overwrite');
});

test('daily puzzles keep seeded number lists and use quality-checked targets', async ({ page }) => {
	await page.clock.install({ time: new Date(2026, 9, 1, 12) });
	await page.goto('/');
	await expect(page.locator('.puzzle-tab')).toHaveText(['66', '118', '296', '398', '453']);
	expect(
		await page
			.locator('.number-button')
			.evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
	).toEqual(['2', '3', '4', '7', '9', '25']);
	await page.reload();
	await expect(page.locator('.puzzle-tab')).toHaveText(['66', '118', '296', '398', '453']);
});
