<script>
	import { StarIcon } from 'svelte-feather-icons';

	/** @type {number}*/
	export let targetNumber;
	/** @type {number} */
	export let stars;
	/** @type {boolean}*/
	export let active;
	/** @type {any} */
	export let handler;
</script>

<td class:active on:click={handler}>
	<div>{targetNumber}</div>
	{#each { length: stars } as _, i}
		<StarIcon />
	{/each}
</td>

<style>
	.active {
		background-color: var(--primary);
		border-radius: 1em;
	}
	td {
		text-align: center;
		border-bottom: none;
	}
</style>
