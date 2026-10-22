import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

/** @type {any[]} */
let scripts;
let imports = 0;
/** @type {Map<string, string>} */
let store;

// A fake page: script tags are recorded instead of fetched, and boxes say whether they're attached.
beforeEach(() => {
	scripts = [];
	globalThis.window = /** @type {any} */ (globalThis);
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
