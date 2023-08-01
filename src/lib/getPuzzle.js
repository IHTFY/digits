import { generateNumLists, generatePuzzle } from './logic.js';

/* Generate 5 sets of 6 input numbers */
const numLists = generateNumLists();

/**
 * Generates the target numbers and solutions for each puzzle
 * @param {number[][]} numLists The list of input numbers
 * @returns { [number[],number,string[]][]} The list of target numbers
 */
const generatePuzzles = (numLists) =>
	numLists.map((a, i) => [a, ...generatePuzzle(a, i * 100 || 50, (i + 1) * 100)]);

const puzzles = generatePuzzles(numLists);

export { puzzles };
