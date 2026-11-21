// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

declare global {
	interface Window {
		/** The shared ad loader, once https://ihtfy.com/ads/v1.js has loaded. */
		ihtfyAds: { show(box: HTMLElement, key: string): void; adFree(): Promise<boolean> };
	}
	/** Set by app.html only on a fresh launch of the installed app; plays the exit from the launch screen. */
	var launchExit: ((play: (overlay: HTMLElement) => Animation[]) => void) | undefined;
}

export {};
