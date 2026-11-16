import { starsFor } from './game.js';
import { operate } from './logic.js';

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param {unknown} value @returns {value is number} */
function isNumber(value) {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** @param {unknown} value @returns {value is number[]} */
function isNumbers(value) {
	return Array.isArray(value) && value.length === 6 && value.every(isNumber);
}

/** @param {unknown} value @returns {value is import('./game.js').Step} */
function isStep(value) {
	if (!isRecord(value) || !Array.isArray(value.numsState) || value.numsState.length !== 6)
		return false;
	if (!value.numsState.every((number) => number === -1 || isNumber(number))) return false;
	if (value.result === -1)
		return (
			value.firstNum === -1 &&
			value.secondNum === -1 &&
			value.firstIndex === -1 &&
			value.secondIndex === -1 &&
			value.operation === ''
		);
	if (
		!isNumber(value.firstIndex) ||
		value.firstIndex >= 6 ||
		!isNumber(value.secondIndex) ||
		value.secondIndex >= 6 ||
		value.firstIndex === value.secondIndex ||
		!isNumber(value.firstNum) ||
		!isNumber(value.secondNum) ||
		!isNumber(value.result) ||
		typeof value.operation !== 'string' ||
		!['plus', 'minus', 'times', 'divide'].includes(value.operation)
	)
		return false;
	return (
		value.firstNum === value.numsState[value.firstIndex] &&
		value.secondNum === value.numsState[value.secondIndex] &&
		operate(value.operation, value.firstNum, value.secondNum) === value.result
	);
}

const SOLUTION_STEP = /^(\d+) ([+×÷-]) (\d+) = (\d+)$/;

/**
 * Replay each step on the numbers still available; the last one must make the target.
 * Only the arithmetic is checked: puzzles from older versions may have longer solutions.
 * @param {number[]} numList @param {number} target @param {string[]} solution
 */
function reachesTarget(numList, target, solution) {
	const pool = [...numList];
	let result = -1;
	for (const step of solution) {
		const match = SOLUTION_STEP.exec(step);
		if (!match) return false;
		const [first, second] = [Number(match[1]), Number(match[3])];
		for (const operand of [first, second]) {
			const slot = pool.indexOf(operand);
			if (slot === -1) return false;
			pool.splice(slot, 1);
		}
		result = Number(match[4]);
		if (!Number.isSafeInteger(result) || operate(match[2], first, second) !== result) return false;
		pool.push(result);
	}
	return result === target;
}

/** @param {unknown} value @returns {value is import('./game.js').Puzzle} */
function isPuzzle(value) {
	if (
		!isRecord(value) ||
		!isNumbers(value.numList) ||
		!isNumber(value.target) ||
		!isNumber(value.distance) ||
		!isNumber(value.stars) ||
		value.stars > 3 ||
		typeof value.revealed !== 'boolean' ||
		!Array.isArray(value.solution) ||
		!value.solution.every((step) => typeof step === 'string') ||
		!Array.isArray(value.history) ||
		value.history.length < 1 ||
		value.history.length > 6 ||
		!value.history.every(isStep)
	)
		return false;
	if (
		value.revision !== undefined &&
		(!isRecord(value.revision) ||
			!isNumber(value.revision.number) ||
			typeof value.revision.id !== 'string' ||
			value.revision.id.length === 0)
	)
		return false;

	const numbers = [...value.numList];
	for (const [index, step] of value.history.entries()) {
		if (!step.numsState.every((number, slot) => number === numbers[slot])) return false;
		const last = index === value.history.length - 1;
		if (last !== (step.result === -1)) return false;
		if (last) break;
		numbers[step.firstIndex] = step.result;
		numbers[step.secondIndex] = -1;
	}

	const target = value.target;
	/** @param {number[]} state */
	const closest = (state) =>
		Math.min(...state.filter((number) => number >= 0).map((number) => Math.abs(number - target)));
	// Undo keeps the best distance, so it may beat every number in the history but never trail one.
	if (value.distance > Math.min(...value.history.map((step) => closest(step.numsState))))
		return false;
	// Stars start at zero before the first move and stop changing once the solution is shown.
	const earned = starsFor(value.distance);
	const unplayed = value.stars === 0 && value.distance === closest(value.numList);
	if (value.revealed ? value.stars > earned : value.stars !== earned && !unplayed) return false;
	return reachesTarget(value.numList, value.target, value.solution);
}

/**
 * The puzzle tab saved with a day's game: a whole number from 0 to 4, else the first tab.
 * @param {string | null} raw
 */
export function parseTabIndex(raw) {
	return raw !== null && /^[0-4]$/.test(raw) ? Number(raw) : 0;
}

/** @param {unknown} value @returns {value is import('./game.js').Puzzle[]} */
export function isSavedGame(value) {
	return Array.isArray(value) && value.length === 5 && value.every(isPuzzle);
}

/**
 * Higher revisions win per puzzle, including undo and reset. Concurrent edits use the
 * edit ID to pick the same winner in every tab. Old saves have revision zero;
 * their serialized value breaks ties when neither puzzle has an edit ID.
 * @param {import('./game.js').Puzzle[]} local
 * @param {import('./game.js').Puzzle[]} incoming
 */
export function mergeSavedGames(local, incoming) {
	return local.map((puzzle, index) => {
		const other = incoming[index];
		const revision = puzzle.revision?.number ?? 0;
		const otherRevision = other.revision?.number ?? 0;
		if (revision !== otherRevision) return revision > otherRevision ? puzzle : other;
		const id = puzzle.revision?.id ?? '';
		const otherId = other.revision?.id ?? '';
		if (id !== otherId) return id > otherId ? puzzle : other;
		return JSON.stringify(puzzle) >= JSON.stringify(other) ? puzzle : other;
	});
}
