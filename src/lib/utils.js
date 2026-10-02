/**
 * Get the date as an integer for use as a seed
 * @param {Date} [date] The local calendar date
 * @returns {number} The date as a number YYYYMMDD
 */
const getDateSeed = (date = new Date()) => {
	return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
};

/**
 * Preserve the original zero-based-month seed for daily number lists.
 * @param {Date} [date]
 * @returns {number}
 */
const getLegacyDateSeed = (date = new Date()) => getDateSeed(date) - 100;

/**
 * A seeded PRNG
 * @param {number} a a seed number
 * @returns {function} a PRNG starting with the seeded random
 */
const mulberry32 = (a) => {
	return () => {
		let t = (a += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

/* Daily puzzle randomness uses the historical seed for compatibility. */
const dateRandom = mulberry32(getLegacyDateSeed());

/**
 * Get a random element from an array
 * @param {any[]} arr Any array
 * @returns {any} A random element from the array
 */
const pickRandom = (arr, seeded = true) =>
	arr.at(Math.floor((seeded ? dateRandom() : Math.random()) * arr.length));

/**
 * Shuffle an array
 * @param {any[]} a The array to shuffle
 * @param {boolean} inplace If true, the array will be shuffled in place
 * @returns {any[]} The shuffled array
 */
const shuffle = (a, inplace = false, seeded = true) => {
	let arr = inplace ? a : [...a];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor((seeded ? dateRandom() : Math.random()) * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

/**
 * Get n random elements from an array
 * @param {any[]} arr Any array
 * @param {number} n Number of random elements to return
 * @returns {any[]} Random elements from the array
 */
const getNRandElements = (arr, n) => shuffle([...arr]).slice(0, n);

export { getDateSeed, getLegacyDateSeed, getNRandElements, pickRandom, shuffle };
