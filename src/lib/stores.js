import { puzzles } from '$lib/getPuzzle';
import { writable } from 'svelte/store';

const theme = writable('light');

const currentPuzzleIndex = writable(0);

const blankState = {
	firstNum: -1,
	firstIndex: -1,
	operation: '',
	secondNum: -1,
	secondIndex: -1,
	result: -1,
	numsState: [-1, -1, -1, -1, -1, -1]
};

/**
 * @type {any[]}
 */
const puzzleArray = [];
for (let i = 0; i < 5; i++) {
	puzzleArray.push({
		numList: puzzles[i][0],
		target: puzzles[i][1],
		stars: 0,
		history: [structuredClone(blankState)],
		solution: puzzles[i][2],
		revealed: false,
		distance: puzzles[i][1]
	});
}

// export const puzzleData = writable(puzzleArray);

function createPuzzles() {
	const { subscribe, set, update } = writable(puzzleArray);

	return {
		subscribe,
		update,
		set,
		reset: (/** @type {number} */ index) =>
			update((puzzles) => {
				puzzles[index].history = [structuredClone(blankState)];
				puzzles[index].history[0].numsState = puzzles[index].numList;
				return puzzles;
			})
	};
}

const puzzleData = createPuzzles();
const modal = writable(false);

export { currentPuzzleIndex, modal, puzzleData, theme };
