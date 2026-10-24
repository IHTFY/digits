<script>
	import { AD_SLOT, showAd } from '#lib/ads.js';

	/** @type {{ adKey: string }} */
	let { adKey } = $props();
	/** @type {HTMLElement | undefined} */
	let box = $state();

	$effect(() => {
		if (box) showAd(box, adKey);
	});
</script>

<!-- Below the game, at least 150px from the buttons; the box keeps its size whether or not an ad fills it. -->
<aside class="ad">
	<p>Advertisements</p>
	<div bind:this={box} class="ad-box" data-ad-slot={AD_SLOT}></div>
	<a href="https://ihtfy.com/privacy" target="_blank" rel="noopener">Privacy</a>
</aside>
