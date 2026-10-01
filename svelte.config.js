import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		serviceWorker: {
			// Deployment metadata and unused sound sources are not offline app assets.
			files: (filepath) =>
				!filepath
					.split('/')
					.some((part) => part.startsWith('.') || part === 'CNAME' || part === 'raw')
		},
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		paths: {
			base: dev ? '' : process.env.BASE_PATH || ''
		}
	}
};

export default config;
