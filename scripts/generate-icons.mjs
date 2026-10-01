// Regenerates the PWA icon set from the original hash glyph: `node scripts/generate-icons.mjs`
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const out = new URL('../static/favicons/', import.meta.url);
const COLOR = '#1095c1';

// The glyph is the original feather "hash" (24-unit grid), centered on the origin.
const glyph = `<g stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" transform="translate(-12 -12)"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></g>`;

/** @param {number} scale glyph size multiplier @param {number} radius corner radius of the 512 canvas */
const svg = (scale, radius = 0) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${radius}" fill="${COLOR}"/><g transform="translate(256 256) scale(${scale})">${glyph}</g></svg>\n`;

const any = svg(17);
// Maskable icons must keep content inside the central 80% circle.
const maskable = svg(14);
const rounded = svg(18, 96);

const png = [
	['android-chrome-192x192.png', any, 192],
	['android-chrome-512x512.png', any, 512],
	['maskable-512x512.png', maskable, 512],
	['apple-touch-icon.png', any, 180],
	['favicon-32x32.png', rounded, 32],
	['favicon-16x16.png', rounded, 16]
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
/** @type {Map<string, Buffer>} */
const rendered = new Map();
for (const [name, source, size] of png) {
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(
		`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`
	);
	const buffer = await page.screenshot({ omitBackground: true });
	rendered.set(name, buffer);
	await writeFile(new URL(name, out), buffer);
}
await browser.close();

// favicon.ico embedding the 16px and 32px PNGs.
const images = ['favicon-16x16.png', 'favicon-32x32.png'].map((name) => ({
	size: name.includes('16x16') ? 16 : 32,
	data: /** @type {Buffer} */ (rendered.get(name))
}));
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach(({ size, data }, i) => {
	const entry = 6 + i * 16;
	header.writeUInt8(size, entry);
	header.writeUInt8(size, entry + 1);
	header.writeUInt16LE(1, entry + 4);
	header.writeUInt16LE(32, entry + 6);
	header.writeUInt32LE(data.length, entry + 8);
	header.writeUInt32LE(offset, entry + 12);
	offset += data.length;
});
await writeFile(new URL('favicon.ico', out), Buffer.concat([header, ...images.map((i) => i.data)]));
await writeFile(new URL('icon.svg', out), rounded);
