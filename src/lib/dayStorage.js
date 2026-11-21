import { getDateSeed } from './utils.js';

/** Days of past saves kept besides today's. */
const KEEP_DAYS = 7;

/**
 * The day an old-style key was saved on, as YYYYMMDD, or NaN when the key is not one.
 * Old versions used a bare eight-digit key whose month counted from zero, so
 * only digits that spell a real calendar day that way can be a save.
 * @param {string} key
 */
function legacyDay(key) {
	const digits = /^(\d{4})(\d{2})(\d{2})$/.exec(key);
	if (!digits) return NaN;
	const [year, month, day] = digits.slice(1).map(Number);
	const date = new Date(year, month, day);
	// The Date rolls an impossible month or day over, and reads a year below 100 as 19xx.
	const real = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
	return real ? getDateSeed(date) : NaN;
}

/**
 * Remove the saves of days long past. Day keys are `digits:YYYYMMDD`, with the open
 * puzzle tab beside each in `digits:YYYYMMDD:tab`; older versions used a bare
 * eight-digit key (see legacyDay). Every other key (theme, sound, ad settings,
 * numbers that are not a day) is left alone.
 * @param {Pick<Storage, 'length' | 'key' | 'removeItem'>} storage
 * @param {Date} [now]
 */
export function removeOldDays(storage, now = new Date()) {
	const cutoff = getDateSeed(
		new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS)
	);
	const old = [];
	for (let i = 0; i < storage.length; i++) {
		const key = storage.key(i) ?? '';
		const day = /^digits:(\d{8})(?::tab)?$/.exec(key)?.[1];
		const date = day ? Number(day) : legacyDay(key);
		if (date < cutoff) old.push(key);
	}
	for (const key of old) storage.removeItem(key);
}
