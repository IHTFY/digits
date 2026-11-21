<script>
	import { showAd } from '#lib/ads.js';

	/** @type {{ adKey: string, ad: { slot: string, size: string } }} */
	let { adKey, ad } = $props();
	/** @type {HTMLElement | undefined} */
	let box = $state();
	const [width, height] = $derived(ad.size.split('x'));

	// The styles leave the box out where the screen clearly cannot hold all of it, and bring it
	// back where it can, as after a rotation. Larger text can still push the box past the bottom
	// of the screen, which the styles do not see, so the box's real place is measured: it is
	// shown to be measured, and left out again unless it ends within the screen. The ad is asked
	// for while the box shows, until the loader takes it: a box that went away while the loader
	// was arriving is asked for again when it next shows.
	$effect(() => {
		if (!box) return;
		const target = box;
		const aside = /** @type {HTMLElement} */ (target.parentElement);
		const root = document.documentElement;
		let asking = false;
		const fits = () => {
			aside.classList.remove('unfit');
			if (!target.offsetWidth) return false;
			const fit = target.getBoundingClientRect().bottom + scrollY <= root.clientHeight;
			aside.classList.toggle('unfit', !fit);
			return fit;
		};
		const observer = new ResizeObserver(async () => {
			if (!fits() || asking) return;
			asking = true;
			const placed = await showAd(target, adKey);
			asking = false;
			if (placed) observer.disconnect();
		});
		// The box has no size while it is left out, so the screen's size brings it back.
		observer.observe(target);
		observer.observe(root);
		return () => observer.disconnect();
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
