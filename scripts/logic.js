import { pickRandom } from "./utils.js";

/**
 * Give the arithmetic result and reject negatives and fractions
 * @param {"+"|"*"|"-"|"/"} operator The arithmetic operator
 * @param {number} a The first number
 * @param {number} b The second number
 * @returns {number|null} The numeric result or null if invalid
 */
const operate = (operator, a, b) => {
  switch (operator) {
    case "+":
      return a + b;
    case "*":
      return a * b;
    case "-":
      return a > b ? a - b : null;
    case "/":
      return b < 1 || (a / b) % 1 ? null : a / b;
    default:
      return null;
  }
};

/* The available arithmetic operators for each puzzle  */
const OPERATORS = ["+", "-", "*", "/"];

/**
 * Applies random operations to generate a target within the range
 * @param {number[]} numList The list building block numbers
 * @param {number} minTarget The minimum target value
 * @param {number} maxTarget The maximum target value
 * @param {number} minOps The minimum number of operations in our solution
 * @param {number} maxOps The maximum number of operations in our solution
 * @returns {number} The target number
 */
const generatePuzzle = (
  numList,
  minTarget,
  maxTarget,
  minOps = 2,
  maxOps = 5
) => {
  let nums = [...numList];
  let ops = 0;
  let steps = [];
  let generated = new Set();

  // perform up to 5 random operations (all numbers combined)
  while (ops < maxOps) {
    let result, a, b, operator;
    // find any valid operation
    while (!result) {
      operator = pickRandom(OPERATORS);
      [a, b] = getNRandElements(
        nums.filter((a) => a), // creating a zero is valid but never makes progress
        2
      );
      result = operate(operator, a, b);
    }

    // update nums
    nums.splice(nums.indexOf(a), 1, null);
    nums.splice(nums.indexOf(b), 1, result);
    ++ops;

    // update generated values
    generated.delete(a);
    generated.delete(b);
    generated.add(result);

    steps.push(`${a} ${operator} ${b} = ${result}`);

    // if the result is within the range, and there are no unused results, and there is more than 1 step, return
    if (
      result > minTarget &&
      result < maxTarget &&
      generated.size < 2 &&
      ops >= minOps
    )
      return [result, steps];

    // reset if no target was created before combining all numbers
    if (ops >= maxOps) {
      // console.log("resetting");
      nums = [...numList];
      steps = [];
      result = null;
      ops = 0;
      generated = new Set();
    }
  }
};

export { OPERATORS, generatePuzzle, operate };