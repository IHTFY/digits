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
