import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			manifest: {
				workbox: {
					globPatterns: ['**/*']
				},
				includeAssets: ['**/*'],
				name: 'Digits',
				short_name: 'Digits',
				icons: [
					{
						src: '/favicons/android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/favicons/android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				],
				theme_color: '#1095c1',
				background_color: '#ffffff',
				display: 'standalone',
				start_url: '/index.html'
			}
		})
	]
});
