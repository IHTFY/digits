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
	// Jan 3, 2027: today's old-style key is 20270003 and the cutoff is Dec 27, 2026.
	// Old-style December keys use month 11: 20261126 is Dec 26 and 20261127 is Dec 27.
	const storage = fakeStorage(['20270003', '20261130', '20261127', '20261126', '20260101']);
	removeOldDays(storage, new Date(2027, 0, 3, 12));
	assert.deepEqual(storage.keys(), ['20261127', '20261130', '20270003']);
});

test('keeps eight-digit keys that no old-style save could have', () => {
	const storage = fakeStorage([
		// Month 45 and month 12: old-style months ran from 00 to 11.
		'12345678',
		'20261203',
		// Day 00, and days past the end of February and April.
		'20260500',
		'20260130',
		'20260331',
		// A leading zero: old versions wrote the date as a number, which has none.
		'09990015',
		// Real old-style saves: Feb 28, 2026 and Dec 26, 2026.
		'20260128',
		'20261126'
	]);
	removeOldDays(storage, new Date(2027, 0, 3, 12));
	assert.deepEqual(storage.keys(), [
		'09990015',
		'12345678',
		'20260130',
		'20260331',
		'20260500',
		'20261203'
	]);
});

test('removes the saved puzzle tab of a past day along with its save, and keeps recent ones', () => {
	const storage = fakeStorage([
		'digits:20261012:tab',
		'digits:20261013:tab',
		'digits:20261020:tab',
		'digits:20261012',
		'digits:20261020',
		'digits:20261020:other'
	]);
	removeOldDays(storage, new Date(2026, 9, 20, 12));
	assert.deepEqual(storage.keys(), [
		'digits:20261013:tab',
		'digits:20261020',
		'digits:20261020:other',
		'digits:20261020:tab'
	]);
});
