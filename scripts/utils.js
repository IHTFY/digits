/**
 * Get the date as an integer for use as a seed
 * @returns {number} The date as a number YYYYMMDD
 */
const getDateSeed = () => {
  const date = new Date();
  return date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
};

/**
 * A seeded PRNG
 * @param {number} a
 * @returns
 */
const mulberry32 = (a) => {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* Overwrite Math.random with a seeded PRNG */
const dateRandom = mulberry32(getDateSeed());
const oldRandom = Math.random; // Save the original Math.random for unlimited puzzles
Math.random = dateRandom;

/**
 * Get a random element from an array
 * @param {[]}} arr Any array
 * @returns {*} A random element from the array
 */
const pickRandom = (arr) => arr.at(Math.floor(Math.random() * arr.length));

/**
 * Shuffle an array
 * @param {[]} arr The array to shuffle
 * @param {boolean} inplace If true, the array will be shuffled in place
 * @returns {[]} The shuffled array
 */
const shuffle = (a, inplace = false) => {
  let arr = inplace ? a : [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Get n random elements from an array
 * @param {[]} arr Any array
 * @param {number} n Number of random elements to return
 * @returns {[]} Random elements from the array
 */
const getNRandElements = (arr, n) => shuffle([...arr]).slice(0, n);

export { getNRandElements, pickRandom, shuffle };
