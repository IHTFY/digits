import { puzzles } from '$lib/getPuzzle';
import { writable } from 'svelte/store';
import { combine, createStep, undo } from './game.js';

const theme = writable('light');
const soundOn = writable(true);

const currentPuzzleIndex = writable(0);

/**
 * @type {import('./game.js').Puzzle[]}
 */
const puzzleArray = [];
for (let i = 0; i < 5; i++) {
	puzzleArray.push({
		numList: puzzles[i][0],
		target: puzzles[i][1],
		stars: 0,
		history: [createStep(puzzles[i][0])],
		solution: puzzles[i][2],
		revealed: false,
		distance: Math.min(...puzzles[i][0].map((number) => Math.abs(number - puzzles[i][1])))
	});
}

function createPuzzles() {
	const { subscribe, set, update } = writable(puzzleArray);

	/** @param {number} index @param {(puzzle: import('./game.js').Puzzle) => void} change */
	function changePuzzle(index, change) {
		update((data) =>
			data.map((puzzle, i) => {
				if (i !== index) return puzzle;
				const next = structuredClone(puzzle);
				change(next);
				return next;
			})
		);
	}

	return {
		subscribe,
		update,
		set,
		combine: (
			/** @type {number} */ index,
			/** @type {number} */ firstIndex,
			/** @type {string} */ operation,
			/** @type {number} */ secondIndex
		) =>
			changePuzzle(index, (puzzle) => {
				combine(puzzle, firstIndex, operation, secondIndex);
			}),
		undo: (/** @type {number} */ index) => changePuzzle(index, undo),
		reveal: (/** @type {number} */ index) =>
			changePuzzle(index, (puzzle) => {
				puzzle.revealed = true;
			}),
		reset: (/** @type {number} */ index) =>
			changePuzzle(index, (puzzle) => {
				puzzle.history = [createStep(puzzle.numList)];
			})
	};
}

const puzzleData = createPuzzles();
const modal = writable(false);

export { currentPuzzleIndex, modal, puzzleData, soundOn, theme };
