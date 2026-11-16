import { test, expect } from '@playwright/test';

test('independent progress survives a storage event queued while another tab plays', async ({
	context,
	baseURL
}) => {
	// Only loopback requests are allowed; the ad loader cannot reach the network.
	await context.route('**/*', (route) =>
		new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort()
	);
	// A browser can queue storage events while a background tab is suspended.
	// Hold the real events to reproduce that scheduling without a timing race.
	await context.addInitScript(() => {
		window.queuedStorageEvents = [];
		window.holdStorageEvents = true;
		window.addEventListener(
			'storage',
			(event) => {
				if (!window.holdStorageEvents) return;
				event.stopImmediatePropagation();
				window.queuedStorageEvents.push(event);
			},
			true
		);
	});
	const a = await context.newPage();
	const b = await context.newPage();
	for (const page of [a, b]) {
		await page.clock.install({ time: new Date(2026, 10, 16, 12) });
		await page.goto('/?adtest=on');
		await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
	}
	await a.getByRole('button', { name: 'Show Solution' }).click();
	await expect(a.getByText('Our Solution', { exact: true })).toBeVisible();
	await expect
		.poll(() =>
			b.evaluate(() =>
				window.queuedStorageEvents.some(
					(event) => event.key === 'digits:20261116' && JSON.parse(event.newValue)[0].revealed
				)
			)
		)
		.toBe(true);

	await b.locator('.puzzle-tab').nth(1).click();
	await b.getByRole('button', { name: 'Show Solution' }).click();
	await expect(b.getByText('Our Solution', { exact: true })).toBeVisible();
	expect(
		await b.evaluate(() => JSON.parse(localStorage.getItem('digits:20261116'))[1].revealed)
	).toBe(true);

	// Deliver tab A's real saved snapshot after tab B has made its own progress.
	await b.evaluate(() => {
		const event = window.queuedStorageEvents.find(
			(event) => event.key === 'digits:20261116' && JSON.parse(event.newValue)[0].revealed
		);
		window.holdStorageEvents = false;
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: event.key,
				oldValue: event.oldValue,
				newValue: event.newValue,
				storageArea: localStorage,
				url: event.url
			})
		);
	});
	// Tab B now has both pieces of information and must preserve both reveals.
	await expect
		.poll(() =>
			b.evaluate(() =>
				JSON.parse(localStorage.getItem('digits:20261116'))
					.slice(0, 2)
					.map((puzzle) => puzzle.revealed)
			)
		)
		.toEqual([true, true]);
	await b.reload();
	await expect(b.getByText('Our Solution', { exact: true })).toBeVisible();
	await b.locator('.puzzle-tab').first().click();
	await expect(b.getByText('Our Solution', { exact: true })).toBeVisible();
});

test('receiving progress already in storage does not echo a save', async ({ context, baseURL }) => {
	await context.route('**/*', (route) =>
		new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort()
	);
	const a = await context.newPage();
	const b = await context.newPage();
	for (const page of [a, b]) {
		await page.clock.install({ time: new Date(2026, 10, 16, 12) });
		await page.goto('/?adtest=on');
		await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
	}
	await b.evaluate(() => {
		window.progressWrites = 0;
		const setItem = Storage.prototype.setItem;
		Storage.prototype.setItem = function (key, value) {
			if (key === 'digits:20261116') window.progressWrites++;
			return setItem.call(this, key, value);
		};
	});
	await a.getByRole('button', { name: 'Show Solution' }).click();
	await expect(b.getByText('Our Solution', { exact: true })).toBeVisible();
	expect(await b.evaluate(() => window.progressWrites)).toBe(0);
});

for (const action of ['Undo', 'Reset puzzle']) {
	test(`a delayed save cannot reverse ${action.toLowerCase()} even if it overwrites storage`, async ({
		page,
		baseURL
	}) => {
		await page.route('**/*', (route) =>
			new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort()
		);
		await page.clock.install({ time: new Date(2026, 10, 16, 12) });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		// HTTP previews do not expose randomUUID; edits must still save there.
		await page.addInitScript(() =>
			Object.defineProperty(crypto, 'randomUUID', { value: undefined })
		);
		await page.goto('/?adtest=on');
		await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
		await page.locator('.number-button').nth(0).click();
		await page.getByRole('button', { name: 'Add', exact: true }).click();
		await page.locator('.number-button').nth(1).click();
		await expect(page.locator('.number-button:not([hidden])')).toHaveCount(5);
		const played = await page.evaluate(() => localStorage.getItem('digits:20261116'));
		expect(JSON.parse(played)[0].revision.number).toBe(1);
		await page.getByRole('button', { name: action, exact: true }).click();
		await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
		const latest = await page.evaluate(() => localStorage.getItem('digits:20261116'));
		expect(JSON.parse(latest)[0].revision.number).toBe(2);
		await page.evaluate((played) => {
			// Simulate a tab that read before this edit and wrote after it.
			const key = 'digits:20261116';
			const oldValue = localStorage.getItem(key);
			localStorage.setItem(key, played);
			window.dispatchEvent(
				new StorageEvent('storage', {
					key,
					oldValue,
					newValue: played,
					storageArea: localStorage,
					url: location.href
				})
			);
		}, played);
		await expect
			.poll(() => page.evaluate(() => localStorage.getItem('digits:20261116')))
			.toBe(latest);
		await page.reload();
		await expect(page.locator('.number-button:not([hidden])')).toHaveCount(6);
	});
}
