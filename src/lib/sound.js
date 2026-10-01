import { base } from '$app/paths';

/** @type {HTMLAudioElement[]} */
const sounds = [];

/** @param {number} index */
export function playSound(index) {
	try {
		const sound = (sounds[index] ||= new Audio(`${base}/blips/${index}.mp3`));
		sound.currentTime = 0;
		void sound.play().catch(() => {});
	} catch {
		// Playback can be unavailable in silent mode or restricted browser contexts.
	}
}
