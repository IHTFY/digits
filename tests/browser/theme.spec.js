import { test, expect } from '@playwright/test';

test('a stored dark theme is on the page before the app starts', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
	await page.route('**/*.js', (route) => route.abort());
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('a stored light theme is on the page before the app starts', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('theme', 'light'));
	await page.route('**/*.js', (route) => route.abort());
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

for (const scheme of ['dark', 'light']) {
	test(`with nothing stored the page stays light under a ${scheme} system theme`, async ({
		page
	}) => {
		await page.emulateMedia({ colorScheme: /** @type {'dark' | 'light'} */ (scheme) });
		await page.goto('/');
		await expect(page.locator('.target-number')).not.toBeEmpty();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	});
}

test('an unrecognized stored theme is ignored', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('theme', 'purple'));
	await page.goto('/');
	await expect(page.locator('.target-number')).not.toBeEmpty();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('a stored dark theme survives a reload', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Switch to dark theme' }).click();
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
