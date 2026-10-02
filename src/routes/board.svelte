<script>
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';
	import { getDateSeed } from '$lib/utils';
	import { isSavedGame } from '$lib/savedGame';
	import { onMount } from 'svelte';
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
	const level = $derived(
		['Beginner', 'Moving Up', 'Solid', 'Nice', 'Great', 'Amazing', 'Genius'][
			totalStars === 15 ? 6 : totalStars === 14 ? 5 : Math.floor(totalStars / 3)
		]
	);
	onMount(() => {
		try {
			const saved = JSON.parse(
				localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey) ?? 'null'
			);
			if (isSavedGame(saved)) puzzleData.set(saved);
		} catch {
			/* Start today's puzzles if saved data is unavailable or damaged. */
		}
		ready = true;
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
