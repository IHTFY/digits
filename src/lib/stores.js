import { writable } from 'svelte/store';

export const theme = writable('light');
export const selected = writable(new Array());
export const currentPuzzle = writable(0);
