import { operate } from './logic.js';

/** @param {number[]} numbers */
export function createStep(numbers) {
	return {
		firstNum: -1,
		firstIndex: -1,
		operation: '',
		secondNum: -1,
		secondIndex: -1,
		result: -1,
		numsState: [...numbers]
	};
}

/**
 * @typedef {ReturnType<typeof createStep>} Step
 * @typedef {{ numList: number[], target: number, stars: number, history: Step[], solution: string[], revealed: boolean, distance: number }} Puzzle
 */

/**
 * Commit a valid merge as one history entry. Invalid operations leave the puzzle intact.
 * @param {Puzzle} puzzle
 * @param {number} firstIndex
 * @param {string} operation
 * @param {number} secondIndex
 */
export function combine(puzzle, firstIndex, operation, secondIndex) {
	const step = puzzle.history.at(-1);
	if (!step || firstIndex === secondIndex) return false;
	const firstNum = step.numsState[firstIndex];
	const secondNum = step.numsState[secondIndex];
	if (!(firstNum >= 0) || !(secondNum >= 0)) return false;
	const result = operate(operation, firstNum, secondNum);
	if (result === null || !Number.isSafeInteger(result)) return false;
	Object.assign(step, { firstNum, firstIndex, operation, secondNum, secondIndex, result });
	const numbers = [...step.numsState];
	numbers[firstIndex] = result;
	numbers[secondIndex] = -1;
	puzzle.history.push(createStep(numbers));
	puzzle.distance = numbers.reduce(
		(distance, number) =>
			number >= 0 ? Math.min(distance, Math.abs(number - puzzle.target)) : distance,
		puzzle.distance
	);
	if (!puzzle.revealed)
		puzzle.stars = [25, 10, 0].filter((threshold) => puzzle.distance <= threshold).length;
	return true;
}

/** @param {Puzzle} puzzle */
export function undo(puzzle) {
	if (puzzle.history.length <= 1) return;
	puzzle.history.pop();
	puzzle.history[puzzle.history.length - 1] = createStep(puzzle.history.at(-1)?.numsState || []);
}
