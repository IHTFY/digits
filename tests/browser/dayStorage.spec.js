import { test, expect } from '@playwright/test';

const today = new Date(2026, 9, 20, 12);

test('saves from days long past are removed on load; recent days, today, and settings stay', async ({
	page
}) => {
	await page.clock.install({ time: today });
	await page.addInitScript(() => {
		if (localStorage.getItem('seeded')) return;
		localStorage.setItem('seeded', '1');
		for (const key of [
			'digits:20230731',
			'digits:20260901',
			'digits:20261012',
			'digits:20261013',
			'digits:20261019',
			'20230630',
			'20260801',
			// Old keys count months from zero: this one is October 19.
			'20260919',
			'theme',
			'sound',
			'ihtfy-ad-free'
		])
			localStorage.setItem(key, 'x');
	});
	await page.goto('/');
	await expect(page.locator('.target-number')).toBeVisible();
	const keys = await page.evaluate(() => Object.keys(localStorage).sort());
	expect(keys).toEqual(
		[
			'digits:20261013',
			'digits:20261019',
			'digits:20261020',
			'20260919',
			'ihtfy-ad-free',
			'seeded',
			'sound',
			'theme'
		].sort()
	);
});

test('progress made in another tab is kept when this tab plays', async ({ context }) => {
	const a = await context.newPage();
	const b = await context.newPage();
	for (const page of [a, b]) await page.clock.install({ time: today });
	await a.goto('/');
	await b.goto('/');
	await expect(a.locator('.target-number')).toBeVisible();
	await expect(b.locator('.target-number')).toBeVisible();

	await a.getByRole('button', { name: 'Show Solution' }).click();
	await expect(a.getByText('Our Solution', { exact: true })).toBeVisible();

	await b.locator('.puzzle-tab').nth(1).click();
	await b.getByRole('button', { name: 'Show Solution' }).click();
	await expect(b.getByText('Our Solution', { exact: true })).toBeVisible();

	await a.reload();
	await a.clock.install({ time: today });
	await a.locator('.puzzle-tab').nth(1).click();
	await expect(a.getByText('Our Solution', { exact: true })).toBeVisible();
	await a.locator('.puzzle-tab').nth(0).click();
	await expect(a.getByText('Our Solution', { exact: true })).toBeVisible();
});
