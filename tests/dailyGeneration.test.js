import assert from 'node:assert/strict';
import test from 'node:test';
import { FALLBACK_PUZZLES, generatePuzzles } from '../src/lib/getPuzzle.js';
import {
	generatePuzzle,
	NUMBERBANKS,
	PuzzleGenerationError,
	verifySolution
} from '../src/lib/logic.js';

const numbers = FALLBACK_PUZZLES.map(([list]) => list);

test('daily generation retries only the failed puzzle and preserves its target range', () => {
	/** @type {{list: number[], min: number, max: number}[]} */
	const calls = [];
	let failed = false;
	const daily = generatePuzzles(numbers, (list, min, max) => {
		calls.push({ list: [...list], min, max });
		if (min === 100 && !failed) {
			failed = true;
			throw new PuzzleGenerationError('Retry this puzzle');
		}
		return generatePuzzle(list, min, max);
	});
	assert.equal(calls.length, 6);
	assert.equal(calls[1].min, 100);
	assert.equal(calls[2].min, 100);
	assert.equal(calls[2].max, 200);
	assert.deepEqual(daily[0][0], numbers[0]);
	assert.deepEqual(daily[2][0], numbers[2]);
	for (const [list, target, solution] of daily)
		assert.equal(verifySolution(list, target, solution), true);
});

test('exhausted daily searches use independent, validated fallback puzzles', () => {
	let attempts = 0;
	const daily = generatePuzzles(numbers, () => {
		attempts++;
		throw new PuzzleGenerationError('No candidate');
	});
	assert.equal(attempts, 25);
	assert.deepEqual(daily, FALLBACK_PUZZLES);
	assert.notEqual(daily[0], FALLBACK_PUZZLES[0]);
	assert.notEqual(daily[0][0], FALLBACK_PUZZLES[0][0]);
	for (const [index, [list, target, solution]] of daily.entries()) {
		assert.equal(verifySolution(list, target, solution), true);
		assert.equal(solution.length, 3);
		assert.ok(target > (index * 100 || 50) && target < (index + 1) * 100);
		assert.ok(
			list.every((value) => NUMBERBANKS[index].includes(value) || (index === 0 && value === 25))
		);
	}
});

test('daily recovery does not hide programming errors', () => {
	assert.throws(
		() =>
			generatePuzzles(numbers, () => {
				throw new TypeError('Unexpected bug');
			}),
		/Unexpected bug/
	);
});
