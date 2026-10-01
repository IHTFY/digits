<script>
	import { Star } from '@lucide/svelte';
	import { playSound } from '$lib/sound';
	/** @type {{targetNumber: number, stars: number, active: boolean, handler: () => void}} */
	let { targetNumber, stars, active, handler } = $props();
</script>

<button
	class="puzzle-tab"
	class:active
	aria-pressed={active}
	aria-label={`Puzzle ${targetNumber}, ${stars} of 3 stars`}
	onclick={() => {
		if (!active) playSound(4);
		handler();
	}}
>
	<span>{targetNumber}</span>
	<span class="tab-stars" aria-hidden="true">
		{#each [0, 1, 2] as star (star)}<Star
				size={12}
				fill={star < stars ? 'currentColor' : 'none'}
				class={star < stars ? 'earned' : ''}
			/>{/each}
	</span>
</button>
