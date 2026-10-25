<script>
	import { showAd } from '#lib/ads.js';

	/** @type {{ adKey: string, ad: { slot: string, size: string } }} */
	let { adKey, ad } = $props();
	/** @type {HTMLElement | undefined} */
	let box = $state();
	const [width, height] = $derived(ad.size.split('x'));

	$effect(() => {
		if (box) showAd(box, adKey);
	});
</script>

<!-- The links come first and the box last, so the box is at least 50px from every link; the box keeps its size whether or not an ad fills it. -->
<aside class="ad">
	<a href="https://ihtfy.com/privacy/" target="_blank" rel="noopener">Privacy</a>
	<p>Advertisements</p>
	<div
		bind:this={box}
		style:width="{width}px"
		style:height="{height}px"
		data-ad-slot={ad.slot}
		data-ad-size={ad.size}
	></div>
</aside>
