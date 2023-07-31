<script>
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';
	import Operations from './operations.svelte';
	import Puzzle from './puzzle.svelte';
	import PuzzleTab from './puzzleTab.svelte';
</script>

<div class="grid">
	<div class="puzzle-container">
		<Puzzle />
	</div>
	<div>
		<!-- <div id="puzzleList" class="grid"> -->
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
		<!-- </div> -->
		<span>Level</span>
		<progress value="2" max="15" />
		<Operations />
	</div>
</div>
