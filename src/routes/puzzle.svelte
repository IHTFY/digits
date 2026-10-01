<script>
	import { operate } from '$lib/logic';
	import { currentPuzzleIndex, puzzleData } from '$lib/stores';
	import { playSound } from '$lib/sound';
	import { tick } from 'svelte';
	import { Divide, Minus, Plus, Rewind, SkipBack, X } from '@lucide/svelte';

	let firstIndex = $state(-1);
	let operation = $state('');
	let merging = $state(false);
	let announcement = $state('');
	/** @type {HTMLButtonElement[]} */
	let numberButtons = [];
	/** @type {Animation | undefined} */
	let mergeAnimation;
	const puzzle = $derived($puzzleData[$currentPuzzleIndex]);
	const numbers = $derived(puzzle.history.at(-1)?.numsState || []);
	const operators = [
		{ value: 'undo', label: 'Undo', icon: Rewind },
		{ value: 'plus', label: 'Add', icon: Plus },
		{ value: 'minus', label: 'Subtract', icon: Minus },
		{ value: 'reset', label: 'Reset puzzle', icon: SkipBack },
		{ value: 'times', label: 'Multiply', icon: X },
		{ value: 'divide', label: 'Divide', icon: Divide }
	];

	$effect(() => {
		// Reset selection on navigation and history changes; cancel motion on cleanup.
		$currentPuzzleIndex;
		puzzle.history.length;
		firstIndex = -1;
		operation = '';
		announcement = '';
		merging = false;
		return () => {
			mergeAnimation?.cancel();
		};
	});

	/** @param {number} index */
	async function selectNumber(index) {
		if (merging) return;
		playSound(2);
		if (firstIndex === index) {
			firstIndex = -1;
			operation = '';
			return;
		}
		if (firstIndex < 0 || !operation) {
			firstIndex = index;
			return;
		}
		const result = operate(operation, numbers[firstIndex], numbers[index]);
		if (result === null || !Number.isSafeInteger(result)) {
			announcement = 'Use an operation that gives a whole, nonnegative number.';
			if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
				numberButtons[index].animate(
					[
						{ transform: 'translateX(0)' },
						{ transform: 'translateX(-4px)' },
						{ transform: 'translateX(4px)' },
						{ transform: 'translateX(0)' }
					],
					{ duration: 180 }
				);
			}
			return;
		}
		const puzzleIndex = $currentPuzzleIndex;
		const fromIndex = firstIndex;
		const selectedOperation = operation;
		const source = numberButtons[fromIndex];
		const destination = numberButtons[index];
		const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		merging = true;
		if (!reducedMotion) {
			const from = source.getBoundingClientRect();
			const to = destination.getBoundingClientRect();
			mergeAnimation = source.animate(
				[
					{ transform: 'translate(0, 0) scale(1)', opacity: 1 },
					{ transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.35)`, opacity: 0 }
				],
				{ duration: 260, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' }
			);
			try {
				await mergeAnimation.finished;
			} catch {
				return;
			}
		}
		if ($currentPuzzleIndex !== puzzleIndex) return;
		puzzleData.combine(puzzleIndex, fromIndex, selectedOperation, index);
		mergeAnimation?.cancel();
		mergeAnimation = undefined;
		firstIndex = -1;
		operation = '';
		merging = false;
		await tick();
		announcement = `${result}${result === puzzle.target ? '. Target reached!' : ''}`;
		if (!reducedMotion)
			destination.animate(
				[{ transform: 'scale(.88)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
				{ duration: 240, easing: 'cubic-bezier(.2, .8, .2, 1)' }
			);
	}

	/** @param {string} value */
	function selectOperation(value) {
		if (merging) return;
		if (value === 'undo' || value === 'reset') {
			playSound(value === 'undo' ? 3 : 1);
			if (value === 'undo') puzzleData.undo($currentPuzzleIndex);
			else puzzleData.reset($currentPuzzleIndex);
			firstIndex = -1;
			operation = '';
		} else if (firstIndex >= 0) {
			playSound(0);
			operation = operation === value ? '' : value;
		}
	}
</script>

<section class="puzzle" aria-label={`Target ${puzzle.target}`} aria-busy={merging}>
	<h1 class="target-number" aria-label={`Target number ${puzzle.target}`}>{puzzle.target}</h1>
	<div class="number-grid">
		{#each numbers as number, index (index)}
			<div class="number-slot">
				<button
					bind:this={numberButtons[index]}
					class="number-button"
					class:selected={firstIndex === index}
					class:long-number={String(number).length > 3}
					class:very-long-number={String(number).length > 5}
					hidden={number < 0}
					aria-pressed={firstIndex === index}
					disabled={merging}
					onclick={() => selectNumber(index)}>{number}</button
				>
			</div>
		{/each}
	</div>
	<div class="operator-grid">
		{#each operators as operator (operator.value)}
			<button
				class="operator-button"
				class:secondary={operator.value === 'undo' || operator.value === 'reset'}
				class:contrast={operator.value !== 'undo' && operator.value !== 'reset'}
				class:chosen={operation === operator.value}
				aria-label={operator.label}
				aria-pressed={operation === operator.value}
				disabled={merging || (operator.value === 'undo' && puzzle.history.length < 2)}
				onclick={() => selectOperation(operator.value)}><operator.icon size={24} /></button
			>
		{/each}
	</div>
	<span class="sr-only" role="status">{announcement}</span>
</section>
