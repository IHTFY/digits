<script>
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';
	import { cubicOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';
	import Operations from './operations.svelte';
	import Puzzle from './puzzle.svelte';
	import PuzzleTab from './puzzleTab.svelte';

	const totalStars = tweened(0, {
		duration: 400,
		easing: cubicOut
	});

	let level = 'Beginner';
	$: {
		totalStars.set($puzzleData.reduce((a, c) => a + c.stars, 0));

		level = ['Beginner', 'Moving Up', 'Solid', 'Nice', 'Great', 'Amazing', 'Genius'][
			Math.floor(Math.max($totalStars - 1, 0) / 3)
		];
	}
</script>

<div class="grid">
	<div class="puzzle-container">
		<Puzzle />
	</div>
	<div>
		<table>
			{#each $puzzleData as puzzle, i}
				<!-- TODO get stars from local storage/store -->
				<PuzzleTab
					targetNumber={puzzle.target}
					stars={puzzle.stars}
					active={$currentPuzzleIndex === i}
					handler={() => currentPuzzleIndex.set(i)}
				/>
			{/each}
		</table>
		<span>{level}</span>
		<progress value={$totalStars} max="15" />
		<Operations />
	</div>
</div>
