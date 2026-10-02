<script>
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';
	import { getDateSeed } from '$lib/utils';
	import { onMount } from 'svelte';
	import Operations from './operations.svelte';
	import Puzzle from './puzzle.svelte';
	import PuzzleTab from './puzzleTab.svelte';

	let ready = $state(false);
	const dateSeed = getDateSeed();
	const totalStars = $derived($puzzleData.reduce((total, puzzle) => total + puzzle.stars, 0));
	const level = $derived(
		['Beginner', 'Moving Up', 'Solid', 'Nice', 'Great', 'Amazing', 'Genius'][
			totalStars === 15 ? 6 : totalStars === 14 ? 5 : Math.floor(totalStars / 3)
		]
	);
	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(String(dateSeed)) || 'null');
			if (
				Array.isArray(saved) &&
				saved.length === 5 &&
				saved.every(
					(puzzle) =>
						Array.isArray(puzzle.numList) &&
						puzzle.numList.length === 6 &&
						Array.isArray(puzzle.history) &&
						puzzle.history.length > 0 &&
						puzzle.history.every(
							(/** @type {import('$lib/game').Step} */ step) =>
								Array.isArray(step.numsState) && step.numsState.length === 6
						) &&
						Array.isArray(puzzle.solution) &&
						Number.isFinite(puzzle.target) &&
						Number.isInteger(puzzle.stars) &&
						puzzle.stars >= 0 &&
						puzzle.stars <= 3 &&
						Number.isFinite(puzzle.distance)
				)
			)
				puzzleData.set(saved);
		} catch {
			/* Start today's puzzles if saved data is unavailable or damaged. */
		}
		ready = true;

		// Let an active game continue past midnight. Only advance the day on return.
		function loadTodayOnReturn() {
			if (document.visibilityState === 'visible' && getDateSeed() !== dateSeed) location.reload();
		}
		document.addEventListener('visibilitychange', loadTodayOnReturn);
		window.addEventListener('pageshow', loadTodayOnReturn);
		return () => {
			document.removeEventListener('visibilitychange', loadTodayOnReturn);
			window.removeEventListener('pageshow', loadTodayOnReturn);
		};
	});
	$effect(() => {
		const data = JSON.stringify($puzzleData);
		if (ready) {
			try {
				localStorage.setItem(String(dateSeed), data);
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
