import assert from 'node:assert/strict';
import test from 'node:test';
import { generatePuzzle, NUMBERBANKS, verifySolution } from '../src/lib/logic.js';

test('the reported 125 solution has a replaceable intermediate', () => {
	const numbers = [5, 6, 8, 9, 20, 25];
	assert.equal(verifySolution(numbers, 125, ['9 - 6 = 3', '8 - 3 = 5', '5 × 25 = 125']), false);
	assert.equal(verifySolution(numbers, 125, ['5 × 25 = 125']), true);
	assert.equal(verifySolution(numbers, 125, ['9 + 6 = 15', '15 × 8 = 120', '120 + 5 = 125']), true);
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

test('generated solutions contain three or four contributing operations across the daily banks', () => {
	for (const [index, bank] of NUMBERBANKS.entries()) {
		for (const numbers of [bank.slice(0, 6), bank.slice(-6)]) {
			const [target, solution] = generatePuzzle(numbers, index * 100 || 50, (index + 1) * 100);
			assert.ok(target > (index * 100 || 50) && target < (index + 1) * 100);
			assert.ok(solution.length >= 3 && solution.length <= 4);
			assert.equal(verifySolution(numbers, target, solution), true);
		}
	}
});

test('impossible requests terminate and invalid operation limits are rejected', () => {
	assert.throws(() => generatePuzzle([1, 2], 100, 200, 1, 1), /attempt limit/);
	assert.throws(() => generatePuzzle([1, 2], 0, 10, 3, 4), /Invalid puzzle/);
	assert.throws(() => generatePuzzle([1, 2, 3], 0, 10, 2, 1), /Invalid puzzle/);
});

test('equal generated and original values are valid when all copies feed the target', () => {
	assert.equal(verifySolution([2, 3, 5], 25, ['2 + 3 = 5', '5 × 5 = 25']), true);
	assert.equal(
		verifySolution([1, 2, 3, 4, 5, 6], 125, [
			'1 + 4 = 5',
			'2 + 3 = 5',
			'5 × 5 = 25',
			'25 × 5 = 125'
		]),
		true
	);
});

test('verification rejects unused duplicate and triplicate results', () => {
	assert.equal(
		verifySolution([1, 2, 3, 4, 5, 25], 125, ['2 + 3 = 5', '4 + 1 = 5', '5 × 25 = 125']),
		false
	);
	assert.equal(
		verifySolution([1, 2, 3, 4, 5, 25], 125, [
			'2 + 3 = 5',
			'4 + 1 = 5',
			'5 + 5 = 10',
			'5 × 25 = 125'
		]),
		false
	);
});

test('equal-value substitutions must preserve distinct input slots', () => {
	assert.equal(
		verifySolution([2, 3, 4, 9, 25], 225, ['2 + 3 = 5', '5 + 4 = 9', '9 × 25 = 225']),
		false
	);
	assert.equal(
		verifySolution([2, 3, 4, 9, 25], 81, ['2 + 3 = 5', '5 + 4 = 9', '9 × 9 = 81']),
		true
	);
});
