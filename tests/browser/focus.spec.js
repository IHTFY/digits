import { test, expect } from '@playwright/test';
import { createStep } from '../../src/lib/game.js';

function fixture() {
	const numList = [1, 2, 4, 5, 10, 25];
	return {
		numList,
		target: 72,
		stars: 0,
		distance: 47,
		history: [createStep(numList)],
		revealed: false,
		solution: ['25 - 1 = 24', '5 - 2 = 3', '24 × 3 = 72']
	};
}

/** @param {import('@playwright/test').Page} page */
async function openGame(page) {
	await page.addInitScript((game) => {
		const date = new Date();
		const key = date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
		if (!localStorage.getItem(String(key))) {
			localStorage.setItem(String(key), JSON.stringify(Array.from({ length: 5 }, () => game)));
		}
	}, fixture());
	await page.goto('/');
	await expect(page.locator('.target-number')).toHaveText('72');
}

/** Select 1, choose Add and select 2 without the pointer, ending the way a keyboard player does. @param {import('@playwright/test').Page} page */
async function mergeOneAndTwo(page) {
	await page.getByRole('button', { name: '1', exact: true }).focus();
	await page.keyboard.press('Enter');
	await page.getByRole('button', { name: 'Add' }).focus();
	await page.keyboard.press('Enter');
	await page.getByRole('button', { name: '2', exact: true }).focus();
	await page.keyboard.press('Enter');
}

test('keyboard focus stays on the tapped number while it merges and lands on the result', async ({
	page
}) => {
	await openGame(page);
	await mergeOneAndTwo(page);
	await expect(page.locator('.puzzle')).toHaveAttribute('aria-busy', 'true');
	await expect(page.getByRole('button', { name: '2', exact: true })).toBeFocused();
	await expect(page.getByRole('button', { name: '3', exact: true })).toBeFocused();
	await expect(page.locator('.puzzle')).toHaveAttribute('aria-busy', 'false');
});

test('a merge does not pull focus away from a control the player moved to meanwhile', async ({
	page
}) => {
	await openGame(page);
	await mergeOneAndTwo(page);
	await page.getByRole('button', { name: 'Reset puzzle' }).focus();
	await expect(page.locator('.puzzle')).toHaveAttribute('aria-busy', 'false');
	await expect(page.getByRole('button', { name: 'Reset puzzle' })).toBeFocused();
});

test('Undo keeps keyboard focus when it takes back the only move', async ({ page }) => {
	await openGame(page);
	await mergeOneAndTwo(page);
	await expect(page.locator('.puzzle')).toHaveAttribute('aria-busy', 'false');
	const undo = page.getByRole('button', { name: 'Undo' });
	await expect(undo).toHaveAttribute('aria-disabled', 'false');
	await undo.focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible();
	await expect(undo).toHaveAttribute('aria-disabled', 'true');
	await expect(undo).toBeFocused();
	// Pressing it again with nothing to undo changes nothing.
	await page.keyboard.press('Enter');
	await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible();
	await expect(undo).toBeFocused();
});

test('Review puzzles puts keyboard focus on the board', async ({ page }) => {
	await page.route('https://ihtfy.com/ads/v1.js', (route) => route.abort());
	await page.goto('/?adtest=on');
	await expect(page.locator('.target-number')).not.toBeEmpty();
	for (let index = 0; index < 5; index++) {
		await page.locator('.puzzle-tab').nth(index).click();
		await page.getByRole('button', { name: 'Show Solution' }).click();
	}
	const review = page.getByRole('button', { name: 'Review puzzles' });
	await review.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('.puzzle')).toBeVisible();
	await expect(page.locator('.number-button:not([hidden])').first()).toBeFocused();
});
