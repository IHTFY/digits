import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const dev = process.argv.includes('dev');

export default defineConfig({
	plugins: [
		sveltekit({
			serviceWorker: {
				// Registered manually so the app can offer updates (see src/routes/updatePrompt.svelte).
				register: false
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: false,
				strict: true
			}),
			paths: {
				base: dev ? '' : /** @type {`/${string}` | ''} */ (process.env.BASE_PATH || '')
			}
		})
	]
});
