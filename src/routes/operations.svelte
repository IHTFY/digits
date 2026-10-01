<script>
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';
	const puzzle = $derived($puzzleData[$currentPuzzleIndex]);
	const steps = $derived(puzzle.history.filter((step) => step.result >= 0));
	const rowCount = $derived(Math.max(steps.length, puzzle.revealed ? puzzle.solution.length : 0));
	/** @type {Record<string, string>} */
	const symbols = { plus: '+', minus: '−', times: '×', divide: '÷' };
</script>

<section class="operations-section" aria-label="Operations">
	<div class="operations-heading">
		<strong>Your Operations</strong>
		{#if !puzzle.revealed}<button
				class="outline solution-button"
				onclick={() => puzzleData.reveal($currentPuzzleIndex)}
				title="You won't earn any more stars for this puzzle">Show Solution</button
			>{:else}<span class="solution-label">Our Solution</span>{/if}
	</div>
	<div class="operations-rows" class:revealed={puzzle.revealed}>
		{#each Array.from({ length: rowCount }, (_, index) => index) as index (index)}
			<div class="equation-row">
				<span class="step-number">{index + 1}</span>
				<span class="equation"
					>{#if steps[index]}{steps[index].firstNum}
						{symbols[steps[index].operation]}
						{steps[index].secondNum} = {steps[index].result}{/if}</span
				>
				{#if puzzle.revealed}<span class="equation solution">{puzzle.solution[index] || ''}</span
					>{/if}
			</div>
		{/each}
	</div>
	<div class="distance-row">
		<span title="Distance from the target to your closest number">Δ</span><span
			>{puzzle.distance}</span
		>{#if puzzle.revealed}<span>0</span>{/if}
	</div>
</section>
