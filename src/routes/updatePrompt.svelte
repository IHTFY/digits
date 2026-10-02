<script>
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	/** @type {ServiceWorker | null} */
	let waiting = $state(null);

	onMount(() => {
		if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

		let reloading = false;
		let disposed = false;
		const listeners = new AbortController();
		const options = { signal: listeners.signal };
		const hadController = !!navigator.serviceWorker.controller;
		/** @type {ServiceWorkerRegistration | undefined} */
		let registration;

		/** @param {ServiceWorkerRegistration} reg */
		function watch(reg) {
			if (reg.waiting && navigator.serviceWorker.controller) waiting = reg.waiting;
			function watchInstallingWorker() {
				const worker = reg.installing;
				worker?.addEventListener(
					'statechange',
					() => {
						if (worker.state === 'installed' && navigator.serviceWorker.controller)
							waiting = worker;
					},
					options
				);
			}
			reg.addEventListener('updatefound', watchInstallingWorker, options);
			// Installation may already have started before register() resolves.
			watchInstallingWorker();
		}

		const checkForUpdate = () => {
			if (document.visibilityState === 'visible') registration?.update().catch(() => {});
		};

		navigator.serviceWorker.addEventListener(
			'controllerchange',
			() => {
				// The first install claims the page; only reload when replacing an older version.
				if (!hadController || reloading) return;
				reloading = true;
				location.reload();
			},
			options
		);

		navigator.serviceWorker
			.register(`${base}/service-worker.js`)
			.then((reg) => {
				if (disposed) return;
				registration = reg;
				watch(reg);
				checkForUpdate();
			})
			.catch(() => {
				/* The app still works online without a service worker. */
			});

		document.addEventListener('visibilitychange', checkForUpdate, options);
		const interval = setInterval(checkForUpdate, 60 * 60 * 1000);
		return () => {
			disposed = true;
			listeners.abort();
			clearInterval(interval);
		};
	});
</script>

{#if waiting}
	<div class="update-prompt" role="status">
		<span>A new version is available.</span>
		<button onclick={() => waiting?.postMessage({ type: 'SKIP_WAITING' })}>Update</button>
	</div>
{/if}

<style>
	.update-prompt {
		position: fixed;
		left: 50%;
		bottom: calc(1rem + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		border-radius: var(--pico-border-radius);
		background: var(--pico-contrast-background);
		color: var(--pico-contrast-inverse);
		box-shadow: 0 4px 16px rgb(0 0 0 / 0.3);
		animation: content-arrive 180ms ease-out;
	}
	.update-prompt button {
		margin: 0;
		padding: 0.35rem 0.9rem;
		width: auto;
	}
</style>
