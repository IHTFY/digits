import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';

/** @type {any[]} */
let scripts;
let imports = 0;
/** @type {Map<string, string>} */
let store;

// A fake page: script tags are recorded instead of fetched, and boxes say whether they're attached.
beforeEach(() => {
	scripts = [];
	globalThis.window = /** @type {any} */ (globalThis);
	const events = new EventTarget();
	globalThis.addEventListener = events.addEventListener.bind(events);
	globalThis.dispatchEvent = events.dispatchEvent.bind(events);
	Object.defineProperty(globalThis, 'navigator', {
		value: { onLine: true },
		configurable: true,
		writable: true
	});
	store = new Map();
	globalThis.localStorage = /** @type {any} */ ({
		getItem: (/** @type {string} */ key) => store.get(key) ?? null
	});
	globalThis.document = /** @type {any} */ ({
		cookie: '',
		createElement: () => Object.assign(new EventTarget(), { remove() {} }),
		head: { appendChild: (/** @type {any} */ script) => scripts.push(script) }
	});
	/** @type {any} */ (globalThis).ihtfyAds = {
		show: (/** @type {any} */ ...args) => shown.push(args)
	};
	shown = [];
});

afterEach(() => {
	delete (/** @type {any} */ (globalThis).ihtfyAds);
	mock.timers.reset();
});

/** @type {any[][]} */
let shown = [];
const box = (isConnected = true) => /** @type {any} */ ({ isConnected });
const tick = () => new Promise((resolve) => setTimeout(resolve));
// A fresh copy of the module each time, so its loader state starts empty.
const loadAds = () => import(`../src/lib/ads.js?${imports++}`);

test('loads the shared loader once, then hands it each box', async () => {
	const { showAd } = await loadAds();
	const a = box();
	const b = box();
	showAd(a, 'one');
	showAd(b, 'two');
	assert.equal(scripts.length, 1);
	assert.equal(scripts[0].src, 'https://ihtfy.com/ads/v1.js');
	scripts[0].dispatchEvent(new Event('load'));
	await tick();
	assert.deepEqual(shown, [
		[a, 'one'],
		[b, 'two']
	]);
});

test('loads nothing offline', async () => {
	globalThis.navigator = /** @type {any} */ ({ onLine: false });
	const { showAd } = await loadAds();
	showAd(box(), 'one');
	assert.equal(scripts.length, 0);
});

test('stays quiet when the loader fails, and tries again on the next call', async () => {
	const { showAd } = await loadAds();
	showAd(box(), 'one');
	scripts[0].dispatchEvent(new Event('error'));
	await tick();
	assert.deepEqual(shown, []);
	showAd(box(), 'two');
	assert.equal(scripts.length, 2);
});

test('skips a box that left the page before the loader arrived', async () => {
	const { showAd } = await loadAds();
	const old = box();
	const current = box();
	showAd(old, 'one');
	old.isConnected = false;
	showAd(current, 'one');
	scripts[0].dispatchEvent(new Event('load'));
	await tick();
	assert.deepEqual(shown, [[current, 'one']]);
});

test('loadForBuyer loads nothing for a visitor without an ad-free token', async () => {
	const { loadForBuyer } = await loadAds();
	loadForBuyer();
	assert.equal(scripts.length, 0);
});

test('loadForBuyer loads the loader at startup when localStorage holds a token', async () => {
	store.set('ihtfy-ad-free', 'token');
	const { loadForBuyer, showAd } = await loadAds();
	loadForBuyer();
	assert.equal(scripts.length, 1);
	assert.equal(scripts[0].src, 'https://ihtfy.com/ads/v1.js');
	showAd(box(), 'one');
	assert.equal(scripts.length, 1);
});

test('loadForBuyer loads the loader at startup when only the cookie holds a token', async () => {
	document.cookie = 'theme=dark; ihtfy-ad-free=token';
	globalThis.localStorage = /** @type {any} */ ({
		getItem: () => {
			throw new Error('storage off');
		}
	});
	const { loadForBuyer } = await loadAds();
	loadForBuyer();
	assert.equal(scripts.length, 1);
});

test('loadForBuyer does not throw when storage and cookies are both denied', async () => {
	globalThis.localStorage = /** @type {any} */ ({
		getItem: () => {
			throw new Error('storage off');
		}
	});
	Object.defineProperty(document, 'cookie', {
		get() {
			throw new Error('cookies off');
		}
	});
	const { loadForBuyer } = await loadAds();
	loadForBuyer();
	assert.equal(scripts.length, 0);
});

test('mayBeAdFree finds a token in localStorage or the cookie', async () => {
	const { mayBeAdFree } = await loadAds();
	assert.equal(mayBeAdFree(), false);
	store.set('ihtfy-ad-free', 'token');
	assert.equal(mayBeAdFree(), true);
	store.clear();
	document.cookie = 'ihtfy-ad-free=token';
	assert.equal(mayBeAdFree(), true);
});

test('showPlayAd loads nothing until the first tap or key press', async () => {
	const { showPlayAd } = await loadAds();
	const a = box();
	showPlayAd(a, 'play/1');
	await tick();
	assert.equal(scripts.length, 0);
	dispatchEvent(new Event('keydown'));
	await tick();
	assert.equal(scripts.length, 1);
	scripts[0].dispatchEvent(new Event('load'));
	await tick();
	assert.deepEqual(shown, [[a, 'play/1']]);
});

test('showPlayAd skips a box that left the page before the first input', async () => {
	const { showPlayAd } = await loadAds();
	const old = box();
	showPlayAd(old, 'play/1');
	old.isConnected = false;
	dispatchEvent(new Event('pointerdown'));
	await tick();
	assert.equal(scripts.length, 0);
});

test('playAdDue waits a minute after the last ad beside the puzzles was placed, not requested', async () => {
	mock.timers.enable({ apis: ['Date'], now: 1_000_000 });
	const { playAdDue, showPlayAd } = await loadAds();
	assert.equal(playAdDue(), true);
	const a = box();
	showPlayAd(a, 'play/1');
	dispatchEvent(new Event('pointerdown'));
	await tick();
	// Requested, but the loader is slow: nothing is placed yet.
	assert.equal(playAdDue(), true);
	mock.timers.tick(90_000);
	scripts[0].dispatchEvent(new Event('load'));
	await tick();
	assert.deepEqual(shown, [[a, 'play/1']]);
	assert.equal(playAdDue(), false);
	mock.timers.tick(59_999);
	assert.equal(playAdDue(), false);
	mock.timers.tick(1);
	assert.equal(playAdDue(), true);
});

test('playAdDue stays true when the box left the page before the loader arrived', async () => {
	const { playAdDue, showPlayAd } = await loadAds();
	const old = box();
	showPlayAd(old, 'play/1');
	dispatchEvent(new Event('pointerdown'));
	await tick();
	old.isConnected = false;
	scripts[0].dispatchEvent(new Event('load'));
	await tick();
	assert.deepEqual(shown, []);
	assert.equal(playAdDue(), true);
});

test('only the results screen gets a box', async () => {
	const { AD_SLOT, adForScreen } = await loadAds();
	assert.deepEqual(adForScreen('results', false), { slot: AD_SLOT, size: '300x250' });
	for (const screen of ['play', 'instructions', 'menu', 'settings', 'home', ''])
		assert.equal(adForScreen(screen, false), null, screen);
});

test('a buyer gets no box on any screen', async () => {
	const { adForScreen } = await loadAds();
	for (const screen of ['results', 'play', 'instructions', 'menu']) {
		assert.equal(adForScreen(screen, true), null, screen);
	}
});

test('the ad beside the puzzles needs a window wider than any phone', async () => {
	const { PLAY_AD_SIZES } = await loadAds();
	assert.ok(PLAY_AD_SIZES.length > 0);
	for (const { query } of PLAY_AD_SIZES) {
		const width = Number(/min-width: (\d+)px/.exec(query)?.[1]);
		assert.ok(width >= 1000, query);
	}
});

test('confirmAdFree asks the loader whether the token is valid', async () => {
	const { confirmAdFree } = await loadAds();
	/** @type {any} */ (globalThis).ihtfyAds.adFree = async () => false;
	const answer = confirmAdFree();
	scripts[0].dispatchEvent(new Event('load'));
	assert.equal(await answer, false);
});

test('confirmAdFree keeps the box hidden when the loader fails to load', async () => {
	const { confirmAdFree } = await loadAds();
	const answer = confirmAdFree();
	scripts[0].dispatchEvent(new Event('error'));
	assert.equal(await answer, true);
});
