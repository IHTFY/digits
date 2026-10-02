import assert from 'node:assert/strict';
import test from 'node:test';
import { generatePuzzle, NUMBERBANKS, operate, verifySolution } from '../src/lib/logic.js';

// Independent search over board states, including both operand orders.
/** @param {number[]} numbers @param {number} operations @param {Set<number>} targets @param {Set<string>} seen */
function reachable(numbers, operations, targets = new Set(), seen = new Set()) {
	for (const number of numbers) targets.add(number);
	if (!operations) return targets;
	const key = `${operations}:${[...numbers].sort((a, b) => a - b)}`;
	if (seen.has(key)) return targets;
	seen.add(key);
	for (let i = 0; i < numbers.length; i++) {
		for (let j = 0; j < numbers.length; j++) {
			if (i === j) continue;
			for (const operator of ['+', '-', '×', '÷']) {
				const result = operate(operator, numbers[i], numbers[j]);
				if (result === null || !Number.isSafeInteger(result)) continue;
				reachable(
					[...numbers.filter((_, index) => index !== i && index !== j), result],
					operations - 1,
					targets,
					seen
				);
			}
		}
	}
	return targets;
}

test('the reported 125 puzzle cannot be generated with a three-step minimum', () => {
	const numbers = [5, 6, 8, 9, 20, 25];
	assert.equal(verifySolution(numbers, 125, ['9 - 6 = 3', '8 - 3 = 5', '5 × 25 = 125']), false);
	assert.equal(verifySolution(numbers, 125, ['5 × 25 = 125']), true);
	assert.throws(() => generatePuzzle(numbers, 124, 126), /No puzzle/);
});

test('verification rejects unused results, replaceable intermediates, and identity operations', () => {
	assert.equal(verifySolution([2, 3, 4, 5, 10, 25], 125, ['2 + 3 = 5', '5 × 25 = 125']), false);
	assert.equal(verifySolution([2, 3, 4, 5, 10, 25], 14, ['2 + 3 = 5', '4 + 10 = 14']), false);
	assert.equal(verifySolution([1, 5, 25], 125, ['5 × 1 = 5', '5 × 25 = 125']), false);
	assert.equal(verifySolution([2, 3, 5, 5, 25], 125, ['2 + 3 = 5', '5 × 25 = 125']), false);
});

test('verification checks arithmetic, consumed slots, final result, and duplicate operands', () => {
	assert.equal(verifySolution([2, 3], 5, ['2 + 3 = 5']), true);
	assert.equal(verifySolution([5, 5], 25, ['5 × 5 = 25']), true);
	assert.equal(verifySolution([5, 6], 25, ['5 × 5 = 25']), false);
	assert.equal(verifySolution([2, 3, 4], 10, ['2 + 3 = 5', '5 + 2 = 7', '7 + 3 = 10']), false);
	assert.equal(verifySolution([2, 3], 6, ['2 + 3 = 6']), false);
	assert.equal(verifySolution([2, 3, 4], 5, ['2 + 3 = 5', '5 + 4 = 9']), false);
	assert.equal(verifySolution([2, 3], 5, ['invalid']), false);
	assert.equal(verifySolution([2, 3], 3, []), true);
});

test('generated solutions are shortest across the daily number banks', () => {
	for (const [index, bank] of NUMBERBANKS.entries()) {
		for (const numbers of [bank.slice(0, 6), bank.slice(-6)]) {
			const [target, solution] = generatePuzzle(numbers, index * 100 || 50, (index + 1) * 100);
			assert.ok(target > (index * 100 || 50) && target < (index + 1) * 100);
			assert.ok(solution.length >= 3 && solution.length <= 4);
			assert.equal(verifySolution(numbers, target, solution), true);
			assert.equal(reachable(numbers, solution.length - 1).has(target), false);
		}
	}
});

test('impossible requests terminate and invalid operation limits are rejected', () => {
	assert.throws(() => generatePuzzle([1, 2], 100, 200, 1, 1), /No puzzle/);
	assert.throws(() => generatePuzzle([1, 2], 0, 10, 3, 4), /Invalid puzzle/);
	assert.throws(() => generatePuzzle([1, 2, 3], 0, 10, 2, 1), /Invalid puzzle/);
});
