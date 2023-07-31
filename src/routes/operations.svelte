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
					times: '*',
					divide: '/'
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
				<th scope="col">Our Solution</th>
			</tr>
		</thead>
		<tbody>
			{#each { length: 5 } as _, i}
				<tr hidden={!currentPuzzle.solution.at(i) && !(currentPuzzle.history.at(i)?.firstNum >= 0)}>
					<th scope="row">{i + 1}</th>
					<td>{formatEquation(currentPuzzle.history.at(i)) || ''}</td>
					<td>{currentPuzzle.solution.at(i) || ''}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<th scope="col">Δ</th>
				<td>Smallest Difference</td>
				<td>0</td>
			</tr>
		</tfoot>
	</table>
</div>
