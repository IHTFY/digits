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

	let numbers = [...value.numList];
	for (const [index, step] of value.history.entries()) {
		if (!step.numsState.every((number, slot) => number === numbers[slot])) return false;
		if (index === value.history.length - 1) return step.result === -1;
		if (step.result === -1) return false;
		numbers[step.firstIndex] = step.result;
		numbers[step.secondIndex] = -1;
	}
	return false;
}

/** @param {unknown} value @returns {value is import('./game.js').Puzzle[]} */
export function isSavedGame(value) {
	return Array.isArray(value) && value.length === 5 && value.every(isPuzzle);
}
