import { test, expect } from '@playwright/test';

const today = new Date(2026, 9, 20, 12);

test('the puzzle tab in play is still open after a reload, and the next day starts on the first', async ({
	page
}) => {
	await page.clock.install({ time: today });
	await page.goto('/');
	await expect(page.locator('.target-number')).not.toBeEmpty();
	await page.locator('.puzzle-tab').nth(3).click();
	await expect(page.locator('.puzzle-tab').nth(3)).toHaveAttribute('aria-pressed', 'true');
	const target =
		(await page
			.locator('.puzzle-tab span')
			.nth(3 * 2)
			.textContent()) ?? '';

	await page.reload();
	await page.clock.install({ time: today });
	await expect(page.locator('.puzzle-tab').nth(3)).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.target-number')).toHaveText(target);

	await page.clock.install({ time: new Date(2026, 9, 21, 12) });
	await page.reload();
	await expect(page.locator('.puzzle-tab').nth(0)).toHaveAttribute('aria-pressed', 'true');
});

for (const stored of ['7', '-1', '2.5', 'abc', '']) {
	test(`a stored tab of "${stored}" is ignored`, async ({ page }) => {
		await page.clock.install({ time: today });
		await page.addInitScript(
			(stored) => localStorage.setItem('digits:20261020:tab', stored),
			stored
		);
		await page.goto('/');
		await expect(page.locator('.target-number')).not.toBeEmpty();
		await expect(page.locator('.puzzle-tab').nth(0)).toHaveAttribute('aria-pressed', 'true');
	});
}
