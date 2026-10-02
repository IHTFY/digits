import assert from 'node:assert/strict';
import test from 'node:test';
import { getDateSeed, getLegacyDateSeed } from '../src/lib/utils.js';

test('calendar date keys use one-based months while legacy puzzle seeds stay unchanged', () => {
	/** @type {[Date, number, number][]} */
	const cases = [
		[new Date(2026, 0, 1), 20260101, 20260001],
		[new Date(2026, 9, 1), 20261001, 20260901],
		[new Date(2026, 11, 31), 20261231, 20261131],
		[new Date(2027, 0, 1), 20270101, 20270001],
		[new Date(2028, 1, 29), 20280229, 20280129]
	];
	for (const [date, key, legacy] of cases) {
		assert.equal(getDateSeed(date), key);
		assert.equal(getLegacyDateSeed(date), legacy);
	}
});
