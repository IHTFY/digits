<script>
	// @ts-nocheck

	import { selected } from '$lib/stores';
	import { onMount } from 'svelte';
	import {
		DivideIcon,
		MinusIcon,
		PlusIcon,
		RewindIcon,
		SkipBackIcon,
		XIcon
	} from 'svelte-feather-icons';

	//initialize handler
	let clearUnused = () => {};

	$: {
		//parse/compile selected array
		if ($selected.at(-1) === 'reset') {
			selected.set([]);
		}
		switch ($selected.length) {
			case 1:
				if (!parseInt($selected[0])) selected.set([]); // if just an operator, reset
				break;
			case 2:
				if (parseInt($selected[1])) selected.update((val) => [val[1]]); // overwrite 1st number
				break;
			case 3:
				if (!parseInt($selected[2])) {
					selected.update((val) => [val[0], val[2]]); // overwrite operator
				} else {
					//TODO try operation, update
					selected.set([]);
				}
				break;
			default:
				selected.update((val) => val.slice(-3)); // trim to length 3
				break;
		}

		clearUnused(); // re-enable all unused buttons
	}

	onMount(() => {
		//redefine this handler which depends on document
		clearUnused = () => {
			document.querySelectorAll('button[disabled]').forEach((btn) => {
				// if button isn't in selected, re-enable
				if (!$selected.includes(btn.getAttribute('data-value'))) btn.removeAttribute('disabled');
			});
		};
	});

	/**
	 * Adds button value to the "selected" array
	 * @param {PointerEvent} event The click event
	 */
	const addToSelected = (event) => {
		/** @ts-ignore @type {HTMLButtonElement} */
		const button = event.currentTarget;
		const buttonValue = button.getAttribute('data-value');
		button.setAttribute('disabled', '');
		selected.update((val) => [...val, buttonValue]);
	};

	/**
	 * @type {[number[], number, string[]]}
	 */
	export let puzzleData;
</script>

<div id="puzzle">
	<h1 id="targetNumber">{puzzleData[1]}</h1>

	<table class="numList">
		<tbody>
			<tr>
				{#each puzzleData[0] as num, i}
					<!-- NOTE there might be a better way to do this, probably numpad component, but handler is funky -->
					{#if i < 3}
						<td>
							<button class="outline" data-value={num} on:click={addToSelected}>
								{num}
							</button>
						</td>
					{/if}
				{/each}
			</tr>
			<tr>
				{#each puzzleData[0] as num, i}
					{#if i >= 3}
						<td>
							<button class="outline" data-value={num} on:click={addToSelected}>
								{num}
							</button>
						</td>
					{/if}
				{/each}
			</tr>
		</tbody>
	</table>
	<table class="operators">
		<tbody>
			<tr>
				<td>
					<button class="secondary" data-value="undo" on:click={addToSelected}>
						<RewindIcon size="3x" />
					</button>
				</td>
				<td>
					<button class="contrast" data-value="plus" on:click={addToSelected}>
						<PlusIcon size="3x" />
					</button>
				</td>
				<td>
					<button class="contrast" data-value="minus" on:click={addToSelected}>
						<MinusIcon size="3x" />
					</button>
				</td>
			</tr>
			<tr>
				<td>
					<button class="secondary" data-value="reset" on:click={addToSelected}>
						<SkipBackIcon size="3x" />
					</button>
				</td>
				<td>
					<button class="contrast" data-value="times" on:click={addToSelected}>
						<XIcon size="3x" />
					</button>
				</td>
				<td>
					<button class="contrast" data-value="divide" on:click={addToSelected}>
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
		min-width: 2em; /* keeps buttons same size, regardless if 1 or 2 digits. 1/2 of font size i think*/
		font-size: 4em;
		font-weight: 800;
		border-radius: 50%;
	}

	table td {
		padding: 1%;
		border-bottom: none;
	}

	#puzzle .numList {
		margin: 0px;
		/* HACK should probably make number components and get the padding in there */
		transform: scale(0.85) translate(0, -10%);
	}
	#puzzle .operators {
		margin: 0;
		/* HACK */
		transform: scale(0.85) translate(0, -20%);
	}
	#puzzle {
		/* HACK */
		margin-bottom: -20%;
	}
</style>
