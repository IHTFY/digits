import { test, expect } from '@playwright/test';

/**
 * The contrast ratio between an element's text color and the first solid
 * background behind it, the way WCAG 2 computes it.
 * @param {import('@playwright/test').Locator} locator
 */
const contrast = (locator) =>
	locator.evaluate((element) => {
		/** @param {string} color */
		const parse = (color) => {
			const [r, g, b, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
			return { r, g, b, a };
		};
		/** Every background from the page up to the element, drawn in order. */
		const layers = [];
		for (let node = /** @type {Element | null} */ (element); node; node = node.parentElement) {
			layers.unshift(parse(getComputedStyle(node).backgroundColor));
		}
		let behind = { r: 255, g: 255, b: 255 };
		for (const layer of layers) {
			behind = {
				r: layer.r * layer.a + behind.r * (1 - layer.a),
				g: layer.g * layer.a + behind.g * (1 - layer.a),
				b: layer.b * layer.a + behind.b * (1 - layer.a)
			};
		}
		/** @param {{ r: number, g: number, b: number }} color */
		const luminance = ({ r, g, b }) => {
			const [red, green, blue] = [r, g, b].map((channel) => {
				const value = channel / 255;
				return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
		};
		const [lighter, darker] = [
			luminance(parse(getComputedStyle(element).color)),
			luminance(behind)
		].sort((a, b) => b - a);
		return (lighter + 0.05) / (darker + 0.05);
	});

for (const theme of ['light', 'dark']) {
	test(`text on and in the brand color has 4.5:1 contrast in the ${theme} theme`, async ({
		page
	}) => {
		await page.addInitScript((theme) => localStorage.setItem('theme', theme), theme);
		await page.setViewportSize({ width: 412, height: 915 });
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
		await expect(page.locator('.target-number')).not.toBeEmpty();
		// Colors fade between states. Without the fades, each read is the settled color.
		await page.addStyleTag({
			content: '*, *::before, *::after { transition: none !important; }'
		});

		/**
		 * @param {import('@playwright/test').Locator} locator
		 * @param {string} name
		 */
		const readable = async (locator, name) =>
			expect.soft(await contrast(locator), name).toBeGreaterThanOrEqual(4.5);

		await page.locator('.number-button').first().click();
		for (const selector of [
			'.puzzle-tab.active',
			'.progress-label > span:first-child',
			'.solution-button',
			'.number-button.selected'
		]) {
			await readable(page.locator(selector), selector);
		}

		// A tab under the pointer shows its number in the text color over the tint.
		const tab = page.locator('.puzzle-tab:not(.active)').first();
		await tab.hover();
		await readable(tab, 'tab under the pointer');

		// An outlined button under the pointer, or holding keyboard focus, takes the hover color.
		const solution = page.locator('.solution-button');
		await solution.hover();
		await readable(solution, 'Show Solution under the pointer');
		await page.mouse.move(0, 0);
		await solution.focus();
		await readable(solution, 'Show Solution with focus');

		await page.getByRole('button', { name: 'Menu', exact: true }).click();
		await page.getByRole('button', { name: 'How to Play' }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
		for (const selector of ['.guide-eyebrow', '.guide-number.selected', '.guide-solution-button']) {
			await readable(page.locator(selector), selector);
		}
		await readable(page.getByRole('button', { name: 'Play', exact: true }), 'Play');
	});
}
