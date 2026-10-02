import assert from 'node:assert/strict';
import test from 'node:test';
import { combine, createStep, undo } from '../src/lib/game.js';
import { isSavedGame } from '../src/lib/savedGame.js';

function savedGame() {
	return Array.from({ length: 5 }, () => ({
		numList: [1, 2, 4, 5, 10, 25],
		target: 72,
		stars: 0,
		distance: 47,
		history: [createStep([1, 2, 4, 5, 10, 25])],
		solution: ['25 - 1 = 24', '5 - 2 = 3', '24 × 3 = 72'],
		revealed: false
	}));
}

test('valid saves survive merges, undo, reset, and revealing a solution', () => {
	const games = savedGame();
	assert.equal(isSavedGame(games), true);
	combine(games[0], 0, 'plus', 1);
	combine(games[0], 0, 'times', 2);
	assert.equal(isSavedGame(games), true);
	undo(games[0]);
	assert.equal(isSavedGame(games), true);
	games[0].revealed = true;
	games[0].history = [createStep(games[0].numList)];
	assert.equal(isSavedGame(games), true);
});

test('malformed values and inconsistent histories are rejected', () => {
	// Deliberately corrupt otherwise typed puzzle data.
	/** @type {((game: any) => void)[]} */
	const mutations = [
		(game) => (game.numList[0] = null),
		(game) => (game.numList[0] = '1'),
		(game) => (game.history[0].numsState[0] = 1.5),
		(game) => (game.history[0].numsState[0] = Number.MAX_SAFE_INTEGER + 1),
		(game) => (game.history[0].numsState[0] = -2),
		(game) => (game.revealed = 'false'),
		(game) => delete game.revealed,
		(game) => (game.solution[0] = {}),
		(game) => (game.distance = -1),
		(game) => (game.target = 1.5),
		(game) => (game.stars = 4),
		(game) => (game.history[0].firstIndex = 8),
		(game) => (game.history[0].numsState[0] = 99),
		(game) => {
			combine(game, 0, 'plus', 1);
			game.history[0].result = 99;
		},
		(game) => {
			combine(game, 0, 'plus', 1);
			game.history[1].numsState[1] = 2;
		}
	];
	for (const mutate of mutations) {
		const games = savedGame();
		mutate(games[0]);
		assert.equal(isSavedGame(games), false);
	}
	for (const value of [null, {}, [], [null, null, null, null, null]])
		assert.equal(isSavedGame(value), false);
});
