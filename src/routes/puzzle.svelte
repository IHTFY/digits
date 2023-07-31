<script>
	import { operate } from '$lib/logic';
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';
	import { onMount } from 'svelte';
	import {
		DivideIcon,
		MinusIcon,
		PlusIcon,
		RewindIcon,
		SkipBackIcon,
		XIcon
	} from 'svelte-feather-icons';

	//initialize sounds
	/**
	 * @type {{ play: () => void; currentTime: number }[]}
	 */
	const blips = [];

	onMount(() => {
		for (let i = 0; i < 4; i++) {
			blips.push(new Audio(`/blips/${i}.mp3`));
		}
	});

	/**
	 *
	 * @param {{ numList: number[]; target: number; stars: number; history:
	 * { firstNum: number; operation: string; secondNum: number; result: number;
	 * firstIndex: number; secondIndex: number; numsState: number[]; }[];
	 * solution: string[]; revealed: boolean; tabIndex: number; distance: number; }[]} data all puzzle data
	 * @param {number} index
	 */

	let currentHistory = $puzzleData[$currentPuzzleIndex].history;
	let currentStep = currentHistory[currentHistory.length - 1];

	// initialize history
	if (!currentHistory[0].numsState.some((/** @type {number} */ elt) => elt >= 0)) {
		puzzleData.reset($currentPuzzleIndex);
	}

	$: {
		currentHistory = $puzzleData[$currentPuzzleIndex].history;
		currentStep = currentHistory[currentHistory.length - 1];

		// initialize history
		if (!currentHistory[0].numsState.some((/** @type {number} */ elt) => elt >= 0)) {
			puzzleData.reset($currentPuzzleIndex);
		}

		if (currentStep.firstNum >= 0 && currentStep.operation && currentStep.secondNum >= 0) {
			const result = operate(currentStep.operation, currentStep.firstNum, currentStep.secondNum);
			if (result || result === 0) {
				currentStep.result = result;

				const newState = [...currentStep.numsState];
				newState[currentStep.firstIndex] = -1;
				newState[currentStep.secondIndex] = currentStep.result;

				const newStep = {
					firstNum: -1,
					operation: '',
					secondNum: -1,
					result: -1,
					firstIndex: -1,
					secondIndex: -1,
					numsState: newState
				};

				// currentHistory.push(newStep);
				puzzleData.update((data) => {
					data[$currentPuzzleIndex].history.push(newStep);
					return data;
				});
				// @ts-ignore
				currentStep = currentHistory.at(-1);
				console.log('set current state to last History');

				//TODO animate and update, maybe not here
			} else {
				currentStep.firstNum = -1;
				currentStep.operation = '';
				currentStep.secondNum = -1;
				currentStep.firstIndex = -1;
				currentStep.secondIndex = -1;
				currentStep.result = -1;
			}
		}

		// Update distance, stars
		puzzleData.update((data) => {
			const currentPuzzle = data[$currentPuzzleIndex];
			currentPuzzle.distance = currentPuzzle.history
				.at(-1)
				.numsState.reduce(
					(a, c) => Math.min(a, Math.abs(c - currentPuzzle.target)),
					currentPuzzle.distance
				);

			currentPuzzle.stars =
				currentPuzzle.distance < 26
					? currentPuzzle.distance < 11
						? currentPuzzle.distance === 0
							? 3
							: 2
						: 1
					: 0;

			console.log(data.map((i) => i.stars));

			return data;
		});

		// 		3 stars: The target number.
		// 2 stars: 1 - 10 away from the target number.
		// 1 star: 11 - 25 away from the target number.
	}

	/**
	 *
	 * @param {number | string} buttonValue
	 * @param {number} buttonIndex
	 */
	const buttonHandler = (buttonValue, buttonIndex = -1) => {
		console.log('firstNum:', $puzzleData[$currentPuzzleIndex].history.at(-1).firstNum);
		if (buttonValue === 'reset') {
			puzzleData.reset($currentPuzzleIndex);
		} else if (buttonValue === 'undo') {
			if (currentHistory.length > 1) {
				puzzleData.update((data) => {
					data[$currentPuzzleIndex].history.pop();
					const prevState = data[$currentPuzzleIndex].history.at(-1);
					prevState.firstNum = -1;
					prevState.operation = '';
					prevState.secondNum = -1;
					prevState.firstIndex = -1;
					prevState.secondIndex = -1;
					prevState.result = -1;
					return data;
				});
				// @ts-ignore
				currentStep = currentHistory.at(-1);
				console.log('currentStep:', currentStep, 'hist len:', currentHistory.length);
			}
		} else if (Number.isInteger(buttonValue)) {
			if (!(currentStep.firstNum >= 0) || !currentStep.operation.length) {
				// @ts-ignore
				currentStep.firstNum = buttonValue;
				currentStep.firstIndex = buttonIndex;
			} else {
				// @ts-ignore
				currentStep.secondNum = buttonValue;
				currentStep.secondIndex = buttonIndex;
			}
		} else {
			if (currentStep.firstNum >= 0) {
				// @ts-ignore
				currentStep.operation = buttonValue;
			}
		}

		let soundIndex = 0;
		if (Number.isInteger(buttonValue)) {
			soundIndex = 2;
		} else {
			switch (buttonValue) {
				case 'reset':
					soundIndex = 1;
					break;
				case 'undo':
					soundIndex = 3;
					break;
			}
		}
		blips[soundIndex].currentTime = 0;
		blips[soundIndex].play();
		console.log('endclick1stnum:', $puzzleData[$currentPuzzleIndex].history.at(-1).firstNum);
	};
</script>

<div id="puzzle">
	<h1 id="targetNumber">{$puzzleData[$currentPuzzleIndex].target}</h1>

	<table class="numList">
		<tbody>
			<tr>
				{#each $puzzleData[$currentPuzzleIndex].history.at(-1).numsState.slice(0, 3) as num, i}
					<td>
						<button
							class="outline"
							data-value={num}
							disabled={currentStep.firstIndex == i || currentStep.secondIndex == i}
							hidden={num < 0}
							on:click={() => {
								buttonHandler(num, i);
							}}
						>
							{num}
						</button>
					</td>
				{/each}
			</tr>
			<tr>
				{#each $puzzleData[$currentPuzzleIndex].history.at(-1).numsState.slice(3) as num, i}
					<td>
						<div>
							<button
								class="outline"
								data-value={num}
								hidden={num < 0}
								disabled={currentStep.firstIndex == i + 3 || currentStep.secondIndex == i + 3}
								on:click={() => buttonHandler(num, i + 3)}
							>
								{num}
							</button>
						</div>
					</td>
				{/each}
			</tr>
		</tbody>
	</table>
	<table class="operators">
		<tbody>
			<tr>
				<td>
					<button class="secondary" data-value="undo" on:click={() => buttonHandler('undo')}>
						<RewindIcon size="3x" />
					</button>
				</td>
				<td>
					<button
						class="contrast"
						data-value="plus"
						disabled={currentStep.operation === 'plus'}
						on:click={() => buttonHandler('plus')}
					>
						<PlusIcon size="3x" />
					</button>
				</td>
				<td>
					<button
						class="contrast"
						data-value="minus"
						disabled={currentStep.operation === 'minus'}
						on:click={() => buttonHandler('minus')}
					>
						<MinusIcon size="3x" />
					</button>
				</td>
			</tr>
			<tr>
				<td>
					<button class="secondary" data-value="reset" on:click={() => buttonHandler('reset')}>
						<SkipBackIcon size="3x" />
					</button>
				</td>
				<td>
					<button
						class="contrast"
						data-value="times"
						disabled={currentStep.operation === 'times'}
						on:click={() => buttonHandler('times')}
					>
						<XIcon size="3x" />
					</button>
				</td>
				<td>
					<button
						class="contrast"
						data-value="divide"
						disabled={currentStep.operation === 'divide'}
						on:click={() => buttonHandler('divide')}
					>
						<DivideIcon size="3x" />
					</button>
				</td>
			</tr>
		</tbody>
	</table>
</div>

<style>
	#targetNumber {
		text-align: center;
		font-size: 4em;
		margin-bottom: 0;
	}

	button {
		border-width: thick;
		aspect-ratio: 1;
	}

	button:disabled {
		background-color: var(--primary);
		color: var(--contrast);
	}

	.numList button {
		color: var(--contrast);
		/* TODO get it working for up to 5 digits, maybe 6. should just be fixed size */
		min-width: 2em; /* keeps buttons same size, regardless if 1 or 2 digits. 1/2 of font size i think*/
		font-size: 4em;
		font-weight: 800;
		border-radius: 50%;
	}

	table * {
		flex-shrink: 0;
	}

	table td {
		padding: 1%;
		border-bottom: none;
	}

	#puzzle {
		/* HACK should probably make number components and get the padding in there */
		transform: scale(0.6) translate(0, -35%);
		margin-bottom: -70%;
	}
</style>
