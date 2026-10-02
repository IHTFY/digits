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
 * @typedef {{value: number, mask: number, cost: number, left?: Expression,
 * right?: Expression, operator?: string}} Expression
 */

/** @param {number[]} numbers @returns {Expression[]} */
const startingExpressions = (numbers) =>
	numbers.map((value, index) => ({ value, mask: 1 << index, cost: 0 }));

/** @param {Expression} left @param {string} operator @param {Expression} right @returns {Expression|null} */
const combineExpressions = (left, operator, right) => {
	if (left.mask & right.mask) return null;
	const value = operate(operator, left.value, right.value);
	if (value === null || !Number.isSafeInteger(value)) return null;
	return {
		value,
		mask: left.mask | right.mask,
		cost: left.cost + right.cost + 1,
		left,
		right,
		operator
	};
};

/**
 * Use cheaper equal values only when their input slots are free outside this branch.
 * Search expressions already encountered, without enumerating shorter solutions.
 * @param {Expression} root
 * @param {Expression[]} known
 * @returns {Expression}
 */
const simplifyExpression = (root, known) => {
	/** @param {Expression} node @param {number} outside @returns {Expression} */
	const simplify = (node, outside) => {
		const cheaper = known.filter(
			(other) => other.value === node.value && other.cost < node.cost && !(other.mask & outside)
		);
		if (cheaper.length) {
			cheaper.sort((a, b) => a.cost - b.cost);
			return simplify(cheaper[0], outside);
		}
		if (!node.left || !node.right || !node.operator) return node;
		const left = simplify(node.left, outside | node.right.mask);
		const right = simplify(node.right, outside | left.mask);
		return combineExpressions(left, node.operator, right) ?? node;
	};
	let previous;
	do {
		previous = root.cost;
		root = simplify(root, 0);
	} while (root.cost < previous);
	return root;
};

/** @param {Expression} node @returns {string[]} */
const expressionSteps = (node) => {
	if (!node.left || !node.right) return [];
	return [
		...expressionSteps(node.left),
		...expressionSteps(node.right),
		`${node.left.value} ${node.operator} ${node.right.value} = ${node.value}`
	];
};

/**
 * Replay exact slots, require every step to feed the final target, and reject
 * cheaper equal-value substitutions. Duplicate values may have different identities.
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
	const equations = steps.map((step) => /^(\d+) ([+×÷-]) (\d+) = (\d+)$/.exec(step));
	if (equations.some((equation) => !equation)) return false;
	const starting = startingExpressions(numList);
	/** @param {number} index @param {Expression[]} pool @param {Expression[]} known @returns {boolean} */
	const replay = (index, pool, known) => {
		if (index === equations.length) {
			if (!index) return numList.includes(target);
			const final = known[known.length - 1];
			return (
				final.value === target &&
				final.cost === steps.length &&
				simplifyExpression(final, known).cost === final.cost
			);
		}
		const equation = equations[index];
		if (!equation) return false;
		const [, first, operator, second, output] = equation;
		for (const [i, a] of pool.entries()) {
			if (a.value !== Number(first)) continue;
			for (const [j, b] of pool.entries()) {
				if (i === j || b.value !== Number(second)) continue;
				const result = combineExpressions(a, operator, b);
				if (!result || result.value !== Number(output)) continue;
				if (
					replay(
						index + 1,
						[...pool.filter((_, slot) => slot !== i && slot !== j), result],
						[...known, result]
					)
				)
					return true;
			}
		}
		return false;
	};
	return replay(0, starting, starting);
};

/**
 * All targets reachable in at most two moves. Two moves that contribute to one
 * result combine a one-move expression with a third, distinct starting slot.
 * @param {number[]} numList
 * @returns {Set<number>}
 */
const getEasyTargets = (numList) => {
	const starting = startingExpressions(numList);
	const targets = new Set(numList);
	/** @type {Expression[]} */
	const oneMove = [];
	for (const a of starting) {
		for (const b of starting) {
			for (const operator of OPERATORS) {
				const result = combineExpressions(a, operator, b);
				if (!result) continue;
				targets.add(result.value);
				oneMove.push(result);
			}
		}
	}
	for (const first of oneMove) {
		for (const second of starting) {
			for (const [a, b] of [
				[first, second],
				[second, first]
			]) {
				for (const operator of OPERATORS) {
					const result = combineExpressions(a, operator, b);
					if (result) targets.add(result.value);
				}
			}
		}
	}
	return targets;
};

// The daily caller retries new number lists and then uses a validated fallback.
class PuzzleGenerationError extends Error {}

/**
 * Generate a target with three to five contributing operations and no two-move shortcut.
 * @param {number[]} numList
 * @param {number} minTarget Exclusive lower bound
 * @param {number} maxTarget Exclusive upper bound
 * @param {number} minOps
 * @param {number} maxOps
 * @returns {[number, string[]]}
 */
const generatePuzzle = (
	numList,
	minTarget,
	maxTarget,
	minOps = 3,
	maxOps = Math.min(5, numList.length - 1)
) => {
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
	const starting = startingExpressions(numList);
	const easyTargets = getEasyTargets(numList);
	for (let attempt = 0; attempt < 500; attempt++) {
		let pool = [...starting];
		const known = [...starting];
		while (pool.length > 1) {
			/** @type {{i: number, j: number, expression: Expression}[]} */
			const options = [];
			for (const [i, a] of pool.entries()) {
				for (const [j, b] of pool.entries()) {
					if (i === j || a.cost + b.cost + 1 > maxOps) continue;
					for (const operator of OPERATORS) {
						const expression = combineExpressions(a, operator, b);
						if (expression && expression.value > 0) options.push({ i, j, expression });
					}
				}
			}
			if (!options.length) break;
			const { i, j, expression } = pickRandom(options);
			pool = [...pool.filter((_, index) => index !== i && index !== j), expression];
			known.push(expression);
			if (
				expression.value <= minTarget ||
				expression.value >= maxTarget ||
				easyTargets.has(expression.value)
			)
				continue;
			const candidate = simplifyExpression(expression, known);
			if (candidate.cost < minOps || candidate.cost > maxOps) continue;
			const steps = expressionSteps(candidate);
			if (verifySolution(numList, candidate.value, steps)) return [candidate.value, steps];
		}
	}
	throw new PuzzleGenerationError('No puzzle found within the generation attempt limit');
};

export {
	NUMBERBANKS,
	OPERATORS,
	PuzzleGenerationError,
	generateNumLists,
	generatePuzzle,
	getEasyTargets,
	operate,
	verifySolution
};
