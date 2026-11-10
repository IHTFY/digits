import assert from 'node:assert/strict';
import test from 'node:test';
import { removeOldDays } from '../src/lib/dayStorage.js';

/** @param {string[]} keys */
function fakeStorage(keys) {
	const items = new Map(keys.map((key) => [key, 'x']));
	return {
		get length() {
			return items.size;
		},
		/** @param {number} index */
		key: (index) => [...items.keys()][index] ?? null,
		/** @param {string} key */
		removeItem: (key) => void items.delete(key),
		keys: () => [...items.keys()].sort()
	};
}

test('removes day saves more than a week old, in both key styles, and nothing else', () => {
	const storage = fakeStorage([
		'digits:20230731',
		'digits:20260901',
		'digits:20261012',
		'digits:20261013',
		'digits:20261020',
		'20230630',
		'20260801',
		'20260919',
		'20261019',
		'theme',
		'sound',
		'ihtfy-ad-free',
		'digits:today',
		'1234567'
	]);
	removeOldDays(storage, new Date(2026, 9, 20, 12));
	assert.deepEqual(storage.keys(), [
		'1234567',
		'20260919',
		'20261019',
		'digits:20261013',
		'digits:20261020',
		'digits:today',
		'ihtfy-ad-free',
		'sound',
		'theme'
	]);
});

test("keeps today's old-style key readable across a year boundary", () => {
	// Jan 3, 2027: today's old-style key is 20261203 and the cutoff is Dec 27, 2026.
	const storage = fakeStorage(['20261203', '20261130', '20261126', '20260101']);
	removeOldDays(storage, new Date(2027, 0, 3, 12));
	assert.deepEqual(storage.keys(), ['20261130', '20261203']);
});
