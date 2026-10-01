import assert from 'node:assert/strict';
import test from 'node:test';
import { combine, createStep, undo } from '../src/lib/game.js';
import { generatePuzzle, operate } from '../src/lib/logic.js';

function puzzle(target = 30) {
	return {
		numList: [1, 2, 4, 5, 10, 25],
		target,
		stars: 0,
		distance: target,
		history: [createStep([1, 2, 4, 5, 10, 25])],
		revealed: false,
		solution: []
	};
}

test('a merge consumes exactly two slots, keeps the result, and can be undone', () => {
	const game = puzzle();
	assert.equal(combine(game, 3, 'plus', 5), true);
	assert.deepEqual(game.history.at(-1)?.numsState, [1, 2, 4, 30, 10, -1]);
	assert.equal(game.history[0].result, 30);
	assert.equal(game.stars, 3);
	undo(game);
	assert.equal(game.history.length, 1);
	assert.deepEqual(game.history[0], createStep(game.numList));
	assert.equal(game.stars, 3, 'earned stars survive undo');
});

test('zero is a valid result and empty slots do not count toward distance', () => {
	const game = puzzle(0);
	game.numList = [2, 2, 4, 5, 10, 25];
	game.history = [createStep(game.numList)];
	assert.equal(combine(game, 0, 'minus', 1), true);
	assert.equal(game.history.at(-1)?.numsState[0], 0);
	assert.equal(game.distance, 0);
	assert.equal(game.stars, 3);
});

test('all operators retain A and consume B, preserving operand order', () => {
	for (const [operation, result] of [
		['plus', 15],
		['minus', 5],
		['times', 50],
		['divide', 2]
	]) {
		const game = puzzle();
		assert.equal(combine(game, 4, String(operation), 3), true);
		assert.equal(game.history.at(-1)?.numsState[4], result);
		assert.equal(game.history.at(-1)?.numsState[3], -1);
		assert.equal(game.history[0].firstNum, 10);
		assert.equal(game.history[0].secondNum, 5);
	}
});

test('invalid operations and repeated slots leave history unchanged', () => {
	for (const [first, operator, second] of [
		[0, 'minus', 5],
		[0, 'divide', 5],
		[0, 'plus', 0],
		[-1, 'plus', 2],
		[0, 'bogus', 2]
	]) {
		const game = puzzle();
		const before = structuredClone(game);
		assert.equal(combine(game, Number(first), String(operator), Number(second)), false);
		assert.deepEqual(game, before);
	}
});

test('consumed numbers cannot be reused, and division by zero is rejected', () => {
	const game = puzzle();
	combine(game, 0, 'plus', 1);
	const before = structuredClone(game);
	assert.equal(combine(game, 1, 'plus', 5), false);
	assert.deepEqual(game, before);
	assert.equal(operate('divide', 5, 0), null);
});

test('revealing a solution freezes stars while operations continue', () => {
	const game = puzzle();
	game.revealed = true;
	game.stars = 1;
	combine(game, 3, 'plus', 5);
	assert.equal(game.distance, 0);
	assert.equal(game.stars, 1);
});

test('large results remain exact and unsafe integers are rejected', () => {
	const game = puzzle();
	game.history = [createStep([999999, 999999, 1, 2, 3, 4])];
	assert.equal(combine(game, 0, 'times', 1), true);
	assert.equal(game.history.at(-1)?.numsState[0], 999998000001);
	game.history = [createStep([Number.MAX_SAFE_INTEGER, 2, 1, 2, 3, 4])];
	assert.equal(combine(game, 0, 'times', 1), false);
});

test('generated solutions reach their target using only available numbers', () => {
	const numbers = [1, 2, 4, 5, 10, 25];
	const [target, solution] = generatePuzzle(numbers, 50, 100);
	const available = [...numbers];
	for (const equation of solution) {
		const [a, operator, b, , result] = equation.split(' ');
		for (const operand of [Number(a), Number(b)]) {
			const index = available.indexOf(operand);
			assert.notEqual(index, -1);
			available.splice(index, 1);
		}
		assert.equal(operate(operator, Number(a), Number(b)), Number(result));
		available.push(Number(result));
	}
	assert.ok(available.includes(target));
});
