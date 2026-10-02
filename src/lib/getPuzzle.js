import { generateNumLists, generatePuzzle, NUMBERBANKS, PuzzleGenerationError } from './logic.js';
import { getNRandElements } from './utils.js';

/** @type {[number[], number, string[]][]} */
export const FALLBACK_PUZZLES = [
	[[1, 2, 3, 4, 5, 25], 64, ['25 - 5 = 20', '20 × 3 = 60', '60 + 4 = 64']],
	[[5, 6, 8, 9, 20, 25], 179, ['6 - 5 = 1', '9 × 20 = 180', '180 - 1 = 179']],
	[[6, 7, 9, 11, 15, 20], 212, ['7 × 11 = 77', '9 × 15 = 135', '77 + 135 = 212']],
	[[5, 6, 9, 11, 13, 20], 341, ['5 + 6 = 11', '11 + 20 = 31', '11 × 31 = 341']],
	[[5, 11, 12, 13, 15, 23], 405, ['5 × 12 = 60', '15 × 23 = 345', '60 + 345 = 405']]
];

/**
 * Retry the affected puzzle with seeded numbers, preserving its target range.
 * A fixed valid puzzle prevents a failed search from blocking the daily game.
 * @param {number[][]} numLists
 * @param {typeof generatePuzzle} generate
 * @returns {[number[], number, string[]][]}
 */
export const generatePuzzles = (numLists, generate = generatePuzzle) =>
	numLists.map((original, index) => {
		let numbers = [...original];
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				return [numbers, ...generate(numbers, index * 100 || 50, (index + 1) * 100)];
			} catch (error) {
				if (!(error instanceof PuzzleGenerationError)) throw error;
			}
			if (attempt < 4) {
				numbers = getNRandElements(NUMBERBANKS[index], 6).sort((a, b) => a - b);
				if (index === 0) numbers[5] = 25;
			}
		}
		return structuredClone(FALLBACK_PUZZLES[index]);
	});

const puzzles = generatePuzzles(generateNumLists());

export { puzzles };
