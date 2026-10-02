import assert from 'node:assert/strict';
import test from 'node:test';
import {
	generatePuzzle,
	NUMBERBANKS,
	getEasyTargets,
	operate,
	verifySolution
} from '../src/lib/logic.js';

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

test('generated solutions contain three to five contributing operations without short target routes', () => {
	for (const [index, bank] of NUMBERBANKS.entries()) {
		for (const numbers of [bank.slice(0, 6), bank.slice(-6)]) {
			const [target, solution] = generatePuzzle(numbers, index * 100 || 50, (index + 1) * 100);
			assert.ok(target > (index * 100 || 50) && target < (index + 1) * 100);
			assert.ok(solution.length >= 3 && solution.length <= 5);
			assert.equal(verifySolution(numbers, target, solution), true);
			assert.equal(shortTargets(numbers).has(target), false);
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

// Independent board-state enumeration checks all operand orders and slot consumption.
/** @param {number[]} numbers @param {number} moves @param {Set<number>} targets */
function shortTargets(numbers, moves = 2, targets = new Set()) {
	for (const value of numbers) targets.add(value);
	if (!moves) return targets;
	for (let i = 0; i < numbers.length; i++) {
		for (let j = 0; j < numbers.length; j++) {
			if (i === j) continue;
			for (const operator of ['+', '-', '×', '÷']) {
				const result = operate(operator, numbers[i], numbers[j]);
				if (result === null || !Number.isSafeInteger(result)) continue;
				shortTargets(
					[...numbers.filter((_, slot) => slot !== i && slot !== j), result],
					moves - 1,
					targets
				);
			}
		}
	}
	return targets;
}

test('short-target search matches board enumeration including duplicates, zero, and reversed division', () => {
	for (const numbers of [
		[5, 6, 8, 9, 20, 25],
		[0, 1, 2, 2, 3, 5],
		[2, 3, 6, 12]
	]) {
		assert.deepEqual(getEasyTargets(numbers), shortTargets(numbers));
	}
	assert.equal(getEasyTargets([2, 3]).has(4), false, 'one slot cannot supply both operands');
	assert.equal(getEasyTargets([2, 2]).has(4), true);
});

test('generation rejects one- and two-move targets even with contributing longer routes', () => {
	const numbers = [5, 6, 8, 9, 20, 25];
	assert.equal(getEasyTargets(numbers).has(125), true);
	assert.equal(verifySolution(numbers, 125, ['9 + 6 = 15', '15 × 8 = 120', '120 + 5 = 125']), true);
	assert.throws(() => generatePuzzle(numbers, 124, 126), /attempt limit/);
	// (20 + 5) × 6 = 150; (20 - 8) × (9 + 6) - (25 + 5) also reaches 150 in five steps.
	assert.equal(
		verifySolution(numbers, 150, [
			'20 - 8 = 12',
			'9 + 6 = 15',
			'12 × 15 = 180',
			'25 + 5 = 30',
			'180 - 30 = 150'
		]),
		true
	);
	assert.throws(() => generatePuzzle(numbers, 149, 151), /attempt limit/);
});

test('a four-step solution remains eligible when a three-step route exists', () => {
	const numbers = [6, 7, 9, 11, 15, 20];
	assert.equal(
		verifySolution(numbers, 212, ['7 × 11 = 77', '9 × 15 = 135', '77 + 135 = 212']),
		true
	);
	const solution = ['20 × 9 = 180', '11 + 6 = 17', '180 + 17 = 197', '15 + 197 = 212'];
	assert.equal(verifySolution(numbers, 212, solution), true);
	assert.equal(getEasyTargets(numbers).has(212), false);
});

test('the default generation limit allows five contributing operations', () => {
	const numbers = [6, 7, 9, 11, 15, 20];
	const [target, solution] = generatePuzzle(numbers, 200, 300, 5);
	assert.equal(solution.length, 5);
	assert.equal(verifySolution(numbers, target, solution), true);
	assert.equal(shortTargets(numbers).has(target), false);
});
