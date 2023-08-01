<script>
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';
	import { getDateSeed } from '$lib/utils';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';
	import Operations from './operations.svelte';
	import Puzzle from './puzzle.svelte';
	import PuzzleTab from './puzzleTab.svelte';

	const totalStars = tweened(0, {
		duration: 300,
		easing: cubicOut
	});

	let level = 'Beginner';
	const dateSeed = getDateSeed();
	let todayData;
	/**
	 * @type {() => void}
	 */
	let saveData = () => {};

	onMount(() => {
		const loadedData = window.localStorage.getItem(String(dateSeed));
		if (loadedData) puzzleData.set(JSON.parse(loadedData));

		saveData = () => {
			window.localStorage.setItem(String(dateSeed), JSON.stringify($puzzleData));
			// window.localStorage.setItem('currentPuzzleIndex', JSON.stringify($currentPuzzleIndex));
		};
	});

	$: {
		totalStars.set($puzzleData.reduce((a, c) => a + c.stars, 0));

		level = ['Beginner', 'Moving Up', 'Solid', 'Nice', 'Great', 'Amazing', 'Genius'][
			Math.round($totalStars === 15 ? 16 : $totalStars / 3)
		];

		saveData();
	}
</script>

<div class="grid">
	<div class="puzzle-container">
		<Puzzle />
	</div>
	<div>
		<table>
			{#each $puzzleData as puzzle, i}
				<PuzzleTab
					targetNumber={puzzle.target}
					stars={puzzle.stars}
					active={$currentPuzzleIndex === i}
					handler={() => currentPuzzleIndex.set(i)}
				/>
			{/each}
		</table>
		<ins>{level}</ins>
		<progress value={$totalStars} max="15" />
		<Operations />
	</div>
</div>
