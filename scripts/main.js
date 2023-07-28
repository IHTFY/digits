import { generateNumLists, generatePuzzle } from "./logic.js";

/**
 * Initialize Materialize components
 */
M.AutoInit();

/* Generate 5 sets of 6 input numbers */
const numLists = generateNumLists();

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
