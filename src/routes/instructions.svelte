<script>
	import { modal } from '$lib/stores';
	import { Star, X } from '@lucide/svelte';
	/** @type {HTMLDialogElement} */
	let dialog;
	$effect(() => {
		if ($modal && !dialog.open) dialog.showModal();
		else if (!$modal && dialog.open) dialog.close();
	});
	/** @param {MouseEvent} event */
	function closeOutside(event) {
		if (event.target !== dialog) return;
		const bounds = dialog.getBoundingClientRect();
		if (
			event.clientX < bounds.left ||
			event.clientX > bounds.right ||
			event.clientY < bounds.top ||
			event.clientY > bounds.bottom
		)
			modal.set(false);
	}
</script>

<dialog
	bind:this={dialog}
	id="instructions"
	aria-labelledby="instructions-title"
	onclose={() => modal.set(false)}
	onclick={closeOutside}
>
	<article>
		<header>
			<strong id="instructions-title">How to Play</strong><button
				class="icon-button"
				aria-label="Close instructions"
				onclick={() => modal.set(false)}><X size={22} /></button
			>
		</header>
		<p>Combine numbers to reach the Target Number.</p>
		<ul>
			<li>You don't need to use all 6 numbers</li>
			<li>Fractions and negative numbers are not allowed</li>
		</ul>
		<p>Earn more stars the closer you get to the Target Number</p>
		<ul class="instruction-stars">
			<li><span><Star size={16} /></span>25 away</li>
			<li><span><Star size={16} /><Star size={16} /></span>10 away</li>
			<li>
				<span><Star size={16} /><Star size={16} /><Star size={16} /></span>Reaching the Target
				Number
			</li>
		</ul>
	</article>
</dialog>
