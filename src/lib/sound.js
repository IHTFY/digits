import { base } from '$app/paths';
import { get } from 'svelte/store';
import { soundOn } from './stores.js';

/** @type {HTMLAudioElement[]} */
const sounds = [];

/** @param {number} index */
export function playSound(index) {
	if (!get(soundOn)) return;
	try {
		const sound = (sounds[index] ||= new Audio(`${base}/blips/${index}.mp3`));
		sound.currentTime = 0;
		void sound.play().catch(() => {});
	} catch {
		// Playback can be unavailable in silent mode or restricted browser contexts.
	}
}
