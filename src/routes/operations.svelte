<script>
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';

	let currentPuzzle = $puzzleData[$currentPuzzleIndex];

	/**
	 *
	 * @param {{firstNum: number; operation: string; secondNum: number; result: number;
	 *  firstIndex: number; secondIndex: number; numsState: number[]; }} step
	 */
	const formatEquation = (step) => {
		if (step?.result >= 0) {
			return [
				step.firstNum,
				// @ts-ignore //TODO just use symbol everywhere?
				{
					plus: '+',
					minus: '-',
					times: '×',
					divide: '÷'
				}[step.operation],
				step.secondNum,
				'=',
				step.result
			].join(' ');
		}
		return '';
	};

	$: {
		currentPuzzle = $puzzleData[$currentPuzzleIndex];
	}
</script>

<div>
	<table role="grid">
		<thead>
			<tr>
				<th scope="col">Step</th>
				<th scope="col">Your Operations</th>
				<th scope="col" hidden={currentPuzzle.revealed}>
					<button
						on:click={() => (currentPuzzle.revealed = true)}
						class="outline"
						data-tooltip="You won't earn any more stars for this puzzle"
					>
						Show Solution
					</button>
				</th>
				<th scope="col" hidden={!currentPuzzle.revealed}>Our Solution</th>
			</tr>
		</thead>
		<tbody>
			{#each { length: 5 } as _, i}
				<tr
					hidden={(!currentPuzzle.solution.at(i) || !currentPuzzle.revealed) &&
						!(currentPuzzle.history.at(i)?.firstNum >= 0)}
				>
					<th scope="row">{i + 1}</th>
					<td>{formatEquation(currentPuzzle.history.at(i)) || ''}</td>
					<td hidden={!currentPuzzle.revealed}>{currentPuzzle.solution.at(i) || ''}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<th
					scope="col"
					data-tooltip="Difference from the target to your closest number"
					data-placement="bottom">Δ</th
				>
				<td>{$puzzleData[$currentPuzzleIndex].distance}</td>
				<td hidden={!currentPuzzle.revealed}>0</td>
			</tr>
		</tfoot>
	</table>
</div>

<style>
	th button {
		margin: 0;
		padding: 0;
	}
</style>
