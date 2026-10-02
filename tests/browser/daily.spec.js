import { test, expect } from '@playwright/test';

test('an active game survives midnight and loads today only on return', async ({ page }) => {
	await page.clock.install({ time: new Date(2026, 9, 1, 23, 59) });
	await page.goto('/');
	await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
	await page.getByRole('button', { name: 'Show Solution' }).click();
	const targets = await page.locator('.puzzle-tab').allTextContents();
	await page.clock.setSystemTime(new Date(2026, 9, 2, 0, 1));
	await expect(page.getByText('Our Solution', { exact: true })).toBeVisible();
	expect(await page.locator('.puzzle-tab').allTextContents()).toEqual(targets);

	// Returning on the same day must also keep progress.
	await page.clock.setSystemTime(new Date(2026, 9, 1, 23, 59));
	await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	await expect(page.getByText('Our Solution', { exact: true })).toBeVisible();
	await page.clock.setSystemTime(new Date(2026, 9, 2, 0, 1));
	await page.evaluate(() => {
		Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
		document.dispatchEvent(new Event('visibilitychange'));
	});
	await expect(page.getByText('Our Solution', { exact: true })).toBeVisible();
	await Promise.all([
		page.waitForEvent('load'),
		page.evaluate(() => {
			Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
			document.dispatchEvent(new Event('visibilitychange'));
		})
	]);
	await expect(page.getByRole('button', { name: 'Show Solution' })).toBeVisible();
	expect(await page.locator('.puzzle-tab').allTextContents()).not.toEqual(targets);
});

test('returning from the back-forward cache loads the current day', async ({ page }) => {
	await page.clock.install({ time: new Date(2026, 9, 1, 23, 59) });
	await page.goto('/');
	await page.getByRole('button', { name: 'Show Solution' }).click();
	await page.clock.setSystemTime(new Date(2026, 9, 2, 0, 1));
	await Promise.all([
		page.waitForEvent('load'),
		page.evaluate(() =>
			window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
		)
	]);
	await expect(page.getByRole('button', { name: 'Show Solution' })).toBeVisible();
});
