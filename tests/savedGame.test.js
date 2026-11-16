import assert from 'node:assert/strict';
import test from 'node:test';
import { combine, createStep, undo } from '../src/lib/game.js';
import { isSavedGame, mergeSavedGames, parseTabIndex } from '../src/lib/savedGame.js';

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

/** @param {import('../src/lib/game.js').Puzzle} game */
function solve(game) {
	combine(game, 5, 'minus', 0); // 25 - 1 = 24
	combine(game, 3, 'minus', 1); // 5 - 2 = 3
	combine(game, 5, 'times', 3); // 24 × 3 = 72
}

test('a played save round-trips exactly', () => {
	const games = savedGame();
	solve(games[0]);
	undo(games[0]);
	combine(games[1], 5, 'times', 1); // 25 × 2 = 50
	games[1].revealed = true;
	combine(games[1], 5, 'plus', 4); // 50 + 10 = 60
	const restored = JSON.parse(JSON.stringify(games));
	assert.equal(isSavedGame(restored), true);
	assert.deepEqual(restored, games);
});

test('progress kept after undoing a solve or after showing the solution is accepted', () => {
	const games = savedGame();
	solve(games[0]);
	undo(games[0]);
	undo(games[0]);
	undo(games[0]);
	assert.deepEqual([games[0].distance, games[0].stars, games[0].history.length], [0, 3, 1]);
	combine(games[1], 5, 'times', 1); // 25 × 2 = 50, one star
	games[1].revealed = true;
	combine(games[1], 5, 'plus', 4); // 50 + 10 = 60
	combine(games[1], 5, 'plus', 3); // 60 + 5 = 65, distance 7
	assert.deepEqual([games[1].distance, games[1].stars], [7, 1]);
	assert.equal(isSavedGame(games), true);
});

test('stars and distance that the history and scoring cannot produce are rejected', () => {
	/** @type {((game: import('../src/lib/game.js').Puzzle) => void)[]} */
	const mutations = [
		// Three stars need a distance of 0.
		(game) => (game.stars = 3),
		(game) => {
			game.revealed = true;
			game.stars = 3;
		},
		(game) => {
			combine(game, 5, 'times', 1); // 25 × 2 = 50, distance 22
			game.stars = 2;
		},
		// The history reached 50, so the best distance is at most 22.
		(game) => {
			combine(game, 5, 'times', 1);
			game.distance = 47;
			game.stars = 0;
		},
		(game) => (game.distance = 48)
	];
	for (const mutate of mutations) {
		const games = savedGame();
		mutate(games[0]);
		assert.equal(isSavedGame(games), false);
	}
});

test('a longer solution saved by an earlier version is accepted', () => {
	const games = savedGame();
	Object.assign(games[0], {
		numList: [5, 6, 8, 9, 20, 25],
		target: 174,
		distance: 149,
		history: [createStep([5, 6, 8, 9, 20, 25])],
		solution: ['25 - 5 = 20', '20 + 9 = 29', '6 × 29 = 174']
	});
	assert.equal(isSavedGame(games), true);
});

test('solutions that do not reach the target with the puzzle numbers are rejected', () => {
	for (const solution of [
		['1 + 1 = 999'],
		['1 + 1 = 2'],
		['25 - 1 = 24', '5 - 2 = 3', '24 × 3 = 73'],
		['25 - 1 = 24', '5 - 2 = 3', '24 × 3 = 72', '72 + 10 = 82'],
		['25 - 1 = 24', '25 - 2 = 23', '24 × 3 = 72'],
		['25 - 1 = 24', '5 - 2 = 3'],
		['25 − 1 = 24', '5 − 2 = 3', '24 × 3 = 72'],
		[]
	]) {
		const games = savedGame();
		games[0].solution = solution;
		assert.equal(isSavedGame(games), false, solution.join(', '));
	}
});

test('a stored puzzle tab is used only when it is a whole number from 0 to 4', () => {
	for (const index of [0, 1, 2, 3, 4]) assert.equal(parseTabIndex(String(index)), index);
	for (const raw of [
		null,
		'',
		'-1',
		'5',
		'1.5',
		'2e0',
		' 2',
		'two',
		'[2]',
		'0x2',
		'99999999999999999999'
	])
		assert.equal(parseTabIndex(raw), 0, String(raw));
});

test('merging independent saves preserves both puzzles regardless of delivery order', () => {
	const original = savedGame();
	const first = savedGame();
	const second = savedGame();
	first[0].revealed = true;
	first[0].revision = { number: 1, id: 'a' };
	combine(second[1], 5, 'times', 1);
	second[1].revision = { number: 1, id: 'b' };
	const merged = mergeSavedGames(first, second);
	assert.deepEqual(merged, [first[0], second[1], ...original.slice(2)]);
	assert.deepEqual(mergeSavedGames(second, first), merged);
	assert.deepEqual(mergeSavedGames(merged, original), merged);
	assert.deepEqual(mergeSavedGames(merged, first), merged);
	assert.equal(isSavedGame(merged), true);
});

test('later undo and reset revisions beat an older history with more moves', () => {
	const played = savedGame();
	combine(played[0], 0, 'plus', 1);
	combine(played[0], 0, 'times', 2);
	played[0].revision = { number: 2, id: 'z' };
	const undone = structuredClone(played);
	undo(undone[0]);
	undone[0].revision = { number: 3, id: 'a' };
	const reset = structuredClone(undone);
	reset[0].history = [createStep(reset[0].numList)];
	reset[0].revision = { number: 4, id: 'b' };
	for (const latest of [undone, reset]) {
		assert.deepEqual(mergeSavedGames(played, latest), latest);
		assert.deepEqual(mergeSavedGames(latest, played), latest);
		assert.equal(isSavedGame(latest), true);
	}
});

test('concurrent edits of the same puzzle converge on the higher edit ID', () => {
	const first = savedGame();
	const second = savedGame();
	combine(first[0], 0, 'plus', 1);
	first[0].revision = { number: 1, id: 'a' };
	second[0].revealed = true;
	second[0].revision = { number: 1, id: 'b' };
	assert.deepEqual(mergeSavedGames(first, second), second);
	assert.deepEqual(mergeSavedGames(second, first), second);
	assert.deepEqual(mergeSavedGames(second, second), second);
});

test('old saves without revisions load and merge deterministically', () => {
	const first = savedGame();
	const second = savedGame();
	first[0].revealed = true;
	assert.equal(isSavedGame(first), true);
	assert.deepEqual(mergeSavedGames(first, second), mergeSavedGames(second, first));
	second[0].revision = { number: 1, id: 'a' };
	assert.deepEqual(mergeSavedGames(first, second), second);
});

test('malformed puzzle revisions are rejected', () => {
	for (const revision of [
		null,
		1,
		{},
		{ number: -1, id: 'a' },
		{ number: 1.5, id: 'a' },
		{ number: Number.MAX_SAFE_INTEGER + 1, id: 'a' },
		{ number: 1, id: '' },
		{ number: 1, id: 5 }
	]) {
		const games = savedGame();
		Object.assign(games[0], { revision });
		assert.equal(isSavedGame(games), false);
	}
});
