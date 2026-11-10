<script>
	import { currentPuzzleIndex, puzzleData } from '#lib/stores.js';
	import { getDateSeed, levelFor } from '#lib/utils.js';
	import { isSavedGame } from '#lib/savedGame.js';
	import { removeOldDays } from '#lib/dayStorage.js';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Operations from './operations.svelte';
	import Puzzle from './puzzle.svelte';
	import PuzzleTab from './puzzleTab.svelte';

	let ready = $state(false);
	const dateSeed = getDateSeed();
	// Namespacing avoids collisions with old numeric keys from a different month.
	const storageKey = `digits:${dateSeed}`;
	// Previous versions encoded months from zero instead of one.
	const legacyStorageKey = String(dateSeed - 100);
	const totalStars = $derived($puzzleData.reduce((total, puzzle) => total + puzzle.stars, 0));
	const level = $derived(levelFor(totalStars));
	onMount(() => {
		try {
			removeOldDays(localStorage);
		} catch {
			/* Storage is unavailable; there is nothing to clean up. */
		}
		try {
			const saved = JSON.parse(
				localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey) ?? 'null'
			);
			if (isSavedGame(saved)) puzzleData.set(saved);
		} catch {
			/* Start today's puzzles if saved data is unavailable or damaged. */
		}
		ready = true;

		// Let an active game continue past midnight. Only advance the day on return.
		function loadTodayOnReturn() {
			if (document.visibilityState === 'visible' && getDateSeed() !== dateSeed) location.reload();
		}
		// Another tab on the same day wrote its progress: pick it up instead of overwriting it.
		/** @param {StorageEvent} event */
		function loadFromOtherTab(event) {
			if (event.storageArea !== localStorage || event.key !== storageKey || !event.newValue) return;
			try {
				const saved = JSON.parse(event.newValue);
				if (isSavedGame(saved) && event.newValue !== JSON.stringify(get(puzzleData)))
					puzzleData.set(saved);
			} catch {
				/* Keep this tab's progress if the other tab's save is damaged. */
			}
		}
		document.addEventListener('visibilitychange', loadTodayOnReturn);
		window.addEventListener('pageshow', loadTodayOnReturn);
		window.addEventListener('storage', loadFromOtherTab);
		return () => {
			window.removeEventListener('storage', loadFromOtherTab);
			document.removeEventListener('visibilitychange', loadTodayOnReturn);
			window.removeEventListener('pageshow', loadTodayOnReturn);
		};
	});
	$effect(() => {
		const data = JSON.stringify($puzzleData);
		if (ready) {
			try {
				localStorage.setItem(storageKey, data);
			} catch {
				/* Play without persistence. */
			}
		}
	});
</script>

<div class="board">
	<div class="puzzle-tabs" aria-label="Daily puzzles">
		{#each $puzzleData as puzzle, index (index)}
			<PuzzleTab
				targetNumber={puzzle.target}
				stars={puzzle.stars}
				active={$currentPuzzleIndex === index}
				handler={() => currentPuzzleIndex.set(index)}
			/>
		{/each}
	</div>
	<div class="puzzle-container"><Puzzle /></div>
	<div class="progress-section">
		<div class="progress-label">
			<span>{level}</span><span class="star-count">{totalStars} / 15</span>
		</div>
		<progress value={totalStars} max="15" aria-label="Stars earned today"></progress>
	</div>
	<Operations />
</div>
