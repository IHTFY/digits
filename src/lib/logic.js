import { getNRandElements, pickRandom } from './utils.js';

/* Bank of numbers for each puzzle */
const NUMBERBANKS = [
	[1, 2, 3, 4, 5, 7, 9, 10, 11, 15],
	[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 20, 25],
	[3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 20, 25],
	[3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 20, 25],
	[3, 5, 7, 9, 11, 12, 13, 15, 18, 19, 20, 23, 25]
];

/**
 * Generates the input numbers for a puzzle
 * @param {number[][]} banks the available numbers for each puzzle
 * @param {number} quantity how many numbers to use from each bank
 * @returns number[][] the input numbers for each puzzle
 */
const generateNumLists = (banks = NUMBERBANKS, quantity = 6) => {
	const numLists = banks.map((a) => getNRandElements(a, quantity).sort((a, b) => a - b));
	numLists[0][5] = 25; // Puzzle 1 always has 25 as the last element
	return numLists;
};

/**
 * Give the arithmetic result and reject negatives and fractions
 * @param {string} operator The arithmetic operator
 * @param {number} a The first number
 * @param {number} b The second number
 * @returns {number|null} The numeric result or null if invalid
 */
const operate = (operator, a, b) => {
	// @ts-ignore
	a = parseInt(a);
	// @ts-ignore
	b = parseInt(b);
	switch (operator) {
		case 'plus':
		case '+':
			return a + b;
		case 'times':
		case '×':
			return a * b;
		case 'minus':
		case '-':
			return a >= b ? a - b : null;
		case 'divide':
		case '÷':
			return b < 1 || (a / b) % 1 ? null : a / b;
		default:
			return null;
	}
};

/* The available arithmetic operators for each puzzle  */
const OPERATORS = ['+', '-', '×', '÷'];

/**
 * Find shortest solutions using disjoint subsets of the input slots.
 * Each expression uses every leaf and intermediate result exactly once.
 * @param {number[]} numList
 * @param {number} maxOps
 * @returns {Map<number, string[]>}
 */
const findSolutions = (numList, maxOps) => {
	/** @type {Map<number, string[]>[]} */
	const subsets = Array.from({ length: 1 << numList.length }, () => new Map());
	/** @type {Map<number, string[]>} */
	const shortest = new Map();
	for (let mask = 1; mask < subsets.length; mask++) {
		const size = mask.toString(2).replaceAll('0', '').length;
		if (size > maxOps + 1) continue;
		const values = subsets[mask];
		if (size === 1) {
			values.set(numList[Math.log2(mask)], []);
		} else {
			for (let left = (mask - 1) & mask; left; left = (left - 1) & mask) {
				const right = mask ^ left;
				if (left > right) continue;
				for (const [a, aSteps] of subsets[left]) {
					for (const [b, bSteps] of subsets[right]) {
						for (const operator of OPERATORS) {
							const pairs =
								operator === '-' || operator === '÷'
									? [
											[a, b],
											[b, a]
										]
									: [[a, b]];
							for (const [first, second] of pairs) {
								const result = operate(operator, first, second);
								if (result === null || !Number.isSafeInteger(result) || values.has(result))
									continue;
								values.set(result, [
									...aSteps,
									...bSteps,
									`${first} ${operator} ${second} = ${result}`
								]);
							}
						}
					}
				}
			}
		}
		for (const [value, steps] of values) {
			const previous = shortest.get(value);
			if (!previous || steps.length < previous.length) shortest.set(value, steps);
		}
	}
	return shortest;
};

/**
 * Verify arithmetic, operand availability, the final target, and optimal length.
 * Unused steps and replaceable intermediates cannot occur in a shortest solution.
 * @param {number[]} numList
 * @param {number} target
 * @param {string[]} steps
 * @returns {boolean}
 */
const verifySolution = (numList, target, steps) => {
	if (
		numList.length < 1 ||
		numList.length > 6 ||
		!numList.every((number) => Number.isSafeInteger(number) && number >= 0) ||
		!Number.isSafeInteger(target) ||
		target < 0 ||
		steps.length > numList.length - 1
	)
		return false;
	const available = [...numList];
	let final = null;
	for (const step of steps) {
		const match = /^(\d+) ([+×÷-]) (\d+) = (\d+)$/.exec(step);
		if (!match) return false;
		const [, first, operator, second, output] = match;
		const a = Number(first),
			b = Number(second),
			result = Number(output);
		if (!Number.isSafeInteger(result) || operate(operator, a, b) !== result) return false;
		for (const operand of [a, b]) {
			const index = available.indexOf(operand);
			if (index === -1) return false;
			available.splice(index, 1);
		}
		available.push(result);
		final = result;
	}
	if (steps.length ? final !== target : !available.includes(target)) return false;
	return findSolutions(numList, steps.length).get(target)?.length === steps.length;
};

/**
 * Choose a target whose shortest solution meets the operation limits.
 * @param {number[]} numList The starting numbers
 * @param {number} minTarget The exclusive lower target bound
 * @param {number} maxTarget The exclusive upper target bound
 * @param {number} minOps The minimum required operations
 * @param {number} maxOps The maximum required operations
 * @returns {[number, string[]]}
 */
const generatePuzzle = (numList, minTarget, maxTarget, minOps = 3, maxOps = 4) => {
	if (
		numList.length < 2 ||
		numList.length > 6 ||
		!numList.every((number) => Number.isSafeInteger(number) && number >= 0) ||
		!Number.isSafeInteger(minOps) ||
		!Number.isSafeInteger(maxOps) ||
		minOps < 1 ||
		minOps > maxOps ||
		maxOps >= numList.length ||
		!Number.isFinite(minTarget) ||
		!Number.isFinite(maxTarget) ||
		minTarget >= maxTarget
	)
		throw new RangeError('Invalid puzzle generation limits or starting numbers');
	const candidates = [...findSolutions(numList, maxOps)].filter(
		([target, steps]) => target > minTarget && target < maxTarget && steps.length >= minOps
	);
	if (!candidates.length) throw new RangeError('No puzzle meets the target and operation limits');
	return pickRandom(candidates);
};

export { NUMBERBANKS, OPERATORS, generateNumLists, generatePuzzle, operate, verifySolution };
