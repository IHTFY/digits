<script>
	import {
		PLAY_AD_SIZES,
		PLAY_AD_SLOT,
		confirmAdFree,
		mayBeAdFree,
		playAdDue,
		showPlayAd
	} from '$lib/ads';
	import { currentPuzzleIndex } from '$lib/stores';
	import { MediaQuery } from 'svelte/reactivity';

	/** @type {{ children: import('svelte').Snippet }} */
	let { children } = $props();

	// A buyer gets no box at all, even before the loader has checked the token.
	// A token the loader rejects brings the box back.
	const held = mayBeAdFree();
	let buyer = $state(held);
	if (held) confirmAdFree().then((free) => (buyer = free));
	const queries = PLAY_AD_SIZES.map((placement) => new MediaQuery(placement.query));
	const size = $derived(buyer ? undefined : PLAY_AD_SIZES.find((_, i) => queries[i].current)?.size);
	const [width, height] = $derived(size?.split('x') ?? []);

	// Opening another puzzle a minute or more after the last ad was requested
	// gives a new box, so a new ad. Puzzles can take seconds, and the ad never
	// changes on a timer.
	let round = $state(0);
	$effect(() => {
		/** @type {number | undefined} */
		let previous;
		return currentPuzzleIndex.subscribe((index) => {
			if (previous !== undefined && index !== previous && playAdDue()) round++;
			previous = index;
		});
	});

	/** @type {HTMLElement | undefined} */
	let box = $state();
	let opened = 0;
	$effect(() => {
		if (box) showPlayAd(box, `play/${++opened}`);
	});

	// The instructions dialog and its backdrop stop 150 px short of the ad.
	$effect(() => {
		if (!box) return;
		const ad = box;
		const root = document.documentElement;
		const track = () =>
			root.style.setProperty(
				'--play-ad-right',
				`${Math.round(root.clientWidth - ad.getBoundingClientRect().left + 150)}px`
			);
		// The root resizes with the window and when a scrollbar appears; either can move the ad.
		const observer = new ResizeObserver(track);
		observer.observe(root);
		return () => {
			observer.disconnect();
			root.style.removeProperty('--play-ad-right');
		};
	});
</script>

<div class="play-frame" class:with-ad={size}>
	{@render children()}
	{#if size}
		{#key `${size}/${round}`}
			<!-- Beside the game, 170px from its nearest button; the box keeps its size whether or not an ad fills it. -->
			<aside class="play-ad" class:narrow={size === '160x600'}>
				<div class="play-ad-row">
					<p>Advertisements</p>
					<a href="https://ihtfy.com/privacy" target="_blank" rel="noopener">Privacy</a>
				</div>
				<div
					bind:this={box}
					style:width="{width}px"
					style:height="{height}px"
					style:min-height="{height}px"
					data-ad-slot={PLAY_AD_SLOT}
					data-ad-size={size}
				></div>
			</aside>
		{/key}
	{/if}
</div>
