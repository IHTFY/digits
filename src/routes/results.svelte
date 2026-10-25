<script>
	import { adForScreen, confirmAdFree, mayBeAdFree } from '#lib/ads.js';
	import { puzzleData } from '#lib/stores.js';
	import { getDateSeed, levelFor } from '#lib/utils.js';
	import { ArrowRight } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import AdSlot from './adSlot.svelte';

	/** @type {{ onreview: () => void }} */
	let { onreview } = $props();

	// A buyer gets no box at all, even before the loader has checked the token.
	// A token the loader rejects brings the box back.
	const held = mayBeAdFree();
	let buyer = $state(held);
	if (held) confirmAdFree().then((free) => (buyer = free));
	const ad = $derived(adForScreen('results', buyer));

	const totalStars = $derived($puzzleData.reduce((total, puzzle) => total + puzzle.stars, 0));
	/** @type {HTMLElement} */
	let heading;
	onMount(() => heading.focus());
</script>

<section class="results" aria-labelledby="results-title">
	<h2 id="results-title" bind:this={heading} tabindex="-1">All puzzles done</h2>
	<p class="results-level"><strong>{levelFor(totalStars)}</strong> · {totalStars} / 15 stars</p>
	<button class="results-review" onclick={onreview}>Review puzzles <ArrowRight size={18} /></button>
	{#if ad}<AdSlot adKey={`digits:${getDateSeed()}`} {ad} />{/if}
</section>
