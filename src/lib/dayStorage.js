import { getDateSeed } from './utils.js';

/** Days of past saves kept besides today's. */
const KEEP_DAYS = 7;

/**
 * Remove the saves of days long past. Day keys are `digits:YYYYMMDD`; older
 * versions used a bare eight-digit key whose month counted from zero. Every
 * other key (theme, sound, ad settings) is left alone.
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
		const day = /^digits:(\d{8})$/.exec(key)?.[1];
		const legacyDay = /^\d{8}$/.exec(key)?.[0];
		const date = day ? Number(day) : legacyDay ? Number(legacyDay) + 100 : NaN;
		if (date < cutoff) old.push(key);
	}
	for (const key of old) storage.removeItem(key);
}
