import { generatePuzzle } from "./logic.js";
import { getNRandElements } from "./utils.js";

/**
 * Initialize Materialize components
 */
M.AutoInit();

/* Bank of numbers for each puzzle */
const SETS = [
  [1, 2, 3, 4, 5, 7, 9, 10, 11, 15],
  [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 20, 25],
  [3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 20, 25],
  [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 20, 25],
  [3, 5, 7, 9, 11, 12, 13, 15, 18, 19, 20, 23, 25],
];

/* Generate the input numbers for each puzzle */
const numLists = SETS.map((a) => getNRandElements(a, 6).sort((a, b) => a - b));
numLists[0][5] = 25; // Puzzle 1 always has 25 as the last element

/**
 * Generates the target numbers and solutions for each puzzle
 * @param {number[][]} numLists The list of input numbers
 * @returns {number[]} The list of target numbers
 */
const generatePuzzles = (numLists) =>
  numLists.map((a, i) => [
    a,
    ...generatePuzzle(a, i * 100 || 50, (i + 1) * 100),
  ]);

const puzzles = generatePuzzles(numLists);
// console.table(puzzles);

//create object from puzzles
const storage = {
  puzzles: [],
  // playedBefore: false,
  // perfectAchieved: false,
  // mostRecentPuz: 4,
  totalStars: 0,
  // dayOfTest: 106,
  // puzzleSet: null,
  // chainMode: false,
};

puzzles.forEach((puzzle) => {
  storage.puzzles.push({
    target: puzzle[1],
    numList: puzzle[0],
    solution: puzzle[2], // NOTE could just store this in memory to obscure a bit more
    locked: false, // TODO check which properties I use
    stars: 0,
    history: [],
    revealed: false,
    tabIndex: 0,
    score: 0,
  });
});

localStorage.setItem("storage", JSON.stringify(storage));
