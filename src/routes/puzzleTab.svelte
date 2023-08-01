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

	let paused = true;
	let currentTime = 0;
</script>

<audio src="/blips/4.mp3" bind:paused bind:currentTime hidden />
<td
	class:active
	on:click={() => {
		handler();
		currentTime = 0;
		paused = active;
	}}
>
	<div>{targetNumber}</div>
	{#each { length: stars } as _, i}
		<StarIcon />
	{/each}
</td>

<style>
	.active {
		background-color: var(--primary);
		border-radius: 1em;
		cursor: auto;
		color: var(--contrast);
	}
	td {
		text-align: center;
		border-bottom: none;
		cursor: pointer;
	}
</style>
