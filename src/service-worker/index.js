/// <reference types="@sveltejs/kit" />

// @ts-nocheck
import { base, build, files, prerendered, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files, // everything in `static`
	...prerendered // prerendered pages
];
const PRECACHED = new Set(ASSETS);

self.addEventListener('install', (event) => {
	// Fetch past the HTTP cache so a new version never precaches stale files.
	// The new worker waits until the page asks it to take over (see `message` below).
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
		await self.clients.claim();
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files`/`prerendered` are served from the cache, never the network
		if (url.origin === self.location.origin && PRECACHED.has(url.pathname)) {
			const cached = await cache.match(url.pathname);
			if (cached) return cached;
		}

		// Page loads (including start_url and ?query variants) get the app shell
		if (event.request.mode === 'navigate' && url.origin === self.location.origin) {
			const shell = await cache.match(`${base}/`);
			if (shell) return shell;
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			return await fetch(event.request);
		} catch {
			return (await cache.match(event.request)) ?? Response.error();
		}
	}

	event.respondWith(respond());
});
