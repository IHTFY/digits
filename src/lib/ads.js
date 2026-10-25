// The ads on the results screen and beside the puzzles come from the shared
// IHTFY loader, which ihtfy.com serves for all the games (its source is in the
// IHTFY/com.ihtfy repo). Nothing ad-related loads before the player's first tap
// or key press: the loader arrives then or when the day is finished, and
// AdSense after it at browser idle. A visitor who may have bought ad-free gets
// the loader at startup instead (loadForBuyer), so it can hide the ad boxes
// before they show.
const LOADER = import.meta.env?.VITE_ADS_LOADER || 'https://ihtfy.com/ads/v1.js';

// The shared 300×250 display unit.
export const AD_SLOT = '6470163205';

// The screens that may hold an ad box. Play never does on a phone; the ad beside
// the puzzles (PLAY_AD_SIZES) needs a window wider than any phone. The menu and
// the instructions are a popover and a dialog, which never hold one either.
/** @type {Record<string, { slot: string, size: string }>} */
const AD_SCREENS = { results: { slot: AD_SLOT, size: '300x250' } };

/**
 * The ad box a screen gets, or null for a screen with none and for a visitor who bought ad-free.
 * @param {string} screen
 * @param {boolean} buyer
 */
export const adForScreen = (screen, buyer) => (buyer ? null : (AD_SCREENS[screen] ?? null));

// The games-play unit: 300×600 in AdSense; the 160×600 box uses it too.
export const PLAY_AD_SLOT = '7239875855';

// The size of the ad beside the puzzles, by window, first match wins. The
// game keeps its full 1120 px width and the ad sits 150 px past it, so it only
// shows on windows wide enough for both. Other windows get no ad during play.
export const PLAY_AD_SIZES = [
	{ query: '(min-width: 1620px) and (min-height: 700px)', size: '300x600' },
	{ query: '(min-width: 1480px) and (min-height: 700px)', size: '160x600' }
];

/** @type {Promise<void> | null} */
let loader = null;

const load = () =>
	(loader ??= new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.async = true;
		script.src = LOADER;
		script.addEventListener('load', () => resolve());
		script.addEventListener('error', () => {
			script.remove();
			loader = null;
			reject(new Error('The ad loader did not load'));
		});
		document.head.appendChild(script);
	}));

/** Whether this browser holds an ad-free token, unchecked; the loader checks it. */
export function mayBeAdFree() {
	let held = false;
	try {
		held = !!localStorage.getItem('ihtfy-ad-free');
	} catch {
		// Storage off: the cookie may still hold the token.
	}
	try {
		held ||= /(?:^|;\s*)ihtfy-ad-free=/.test(document.cookie);
	} catch {
		// Cookies off too: treat the visitor as having no token.
	}
	return held;
}

/**
 * Whether the loader accepts this browser's ad-free token. A loader that fails
 * to load counts as yes, since no ad could load then either.
 * @returns {Promise<boolean>}
 */
export const confirmAdFree = () =>
	load().then(
		() => window.ihtfyAds.adFree(),
		() => true
	);

/** Loads the loader now if this browser holds an ad-free token, so it can hide every ad box. */
export function loadForBuyer() {
	if (mayBeAdFree()) load().catch(() => {});
}

/**
 * Fills `box` with an ad for the finished day named `key`; offline or on failure it stays empty.
 * Resolves to whether the loader was asked to place the ad.
 * @param {HTMLElement} box
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export function showAd(box, key) {
	if (!navigator.onLine) return Promise.resolve(false);
	return load().then(
		() => {
			if (!box.isConnected) return false;
			window.ihtfyAds.show(box, key);
			return true;
		},
		() => false
	);
}

// The player's first tap or key press. The ad beside the puzzles is on the page
// from the start, and the ad code waits for this, not for the page load.
const firstInput = new Promise((resolve) => {
	for (const type of ['pointerdown', 'keydown'])
		addEventListener(type, resolve, { once: true, capture: true });
});

let playAdPlacedAt = -Infinity;

/**
 * Fills `box` with the ad beside the puzzles, once the player has tapped or pressed a key, if the box is still on the page.
 * @param {HTMLElement} box
 * @param {string} key
 */
export function showPlayAd(box, key) {
	firstInput
		.then(() => box.isConnected && showAd(box, key))
		.then((placed) => {
			if (placed) playAdPlacedAt = Date.now();
		});
}

/** Whether a newly opened puzzle may get a new ad: the last one beside the puzzles was placed at least a minute ago. */
export const playAdDue = () => Date.now() - playAdPlacedAt >= 60_000;
