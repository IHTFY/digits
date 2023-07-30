<script>
	import { puzzles } from '$lib/getPuzzle';
	import { currentPuzzle } from '$lib/stores';
	import Operations from './operations.svelte';
	import Puzzle from './puzzle.svelte';
	import PuzzleTab from './puzzleTab.svelte';
</script>

<div class="grid">
	<div class="puzzle-container">
		<Puzzle puzzleData={puzzles[$currentPuzzle]} />
	</div>
	<div>
		<!-- <div id="puzzleList" class="grid"> -->
		<table>
			{#each puzzles as puzzle, i}
				<!-- TODO get stars from local storage/store -->
				<PuzzleTab
					targetNumber={puzzle[1]}
					stars={2}
					active={$currentPuzzle === i}
					handler={() => currentPuzzle.set(i)}
				/>
			{/each}
		</table>
		<!-- </div> -->
		<span>Level</span>
		<progress value="2" max="15" />
		<Operations />
	</div>
</div>
