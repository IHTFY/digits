<script>
	import { modal } from '$lib/stores';
	import {
		ArrowRight,
		Check,
		Divide,
		Minus,
		Plus,
		Rewind,
		SkipBack,
		Star,
		Target,
		X
	} from '@lucide/svelte';
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
		<div class="guide-intro">
			<span class="guide-eyebrow">A little arithmetic. A satisfying finish.</span>
			<h2>Six numbers. One target.</h2>
			<p>Combine the numbers to get as close as you can. Five fresh puzzles await you every day.</p>
		</div>
		<section class="guide-example" aria-label="Example: 10 plus 5 makes the target of 15">
			<div class="guide-target"><Target size={18} /><span>Target <strong>15</strong></span></div>
			<div class="guide-equation" aria-hidden="true">
				<span class="guide-number selected">10</span>
				<span class="guide-control contrast"><Plus size={22} /></span>
				<span class="guide-number">5</span>
				<ArrowRight size={20} />
				<span class="guide-number result">15<Check size={14} /></span>
			</div>
			<p>Pick a number, choose an operation, then pick another number.</p>
		</section>
		<div class="guide-tips">
			<section>
				<div class="guide-operators" aria-hidden="true">
					<span class="guide-control contrast"><Plus size={18} /></span>
					<span class="guide-control contrast"><Minus size={18} /></span>
					<span class="guide-control contrast"><X size={18} /></span>
					<span class="guide-control contrast"><Divide size={18} /></span>
				</div>
				<h3>Build on your result</h3>
				<p>
					Your two numbers become one. Use that new number in your next move. You don’t need all
					six; keep results whole and zero or above.
				</p>
			</section>
			<section>
				<div class="guide-operators" aria-hidden="true">
					<span class="guide-tool"
						><span class="guide-control secondary"><Rewind size={18} /></span><span>Undo</span
						></span
					>
					<span class="guide-tool"
						><span class="guide-control secondary"><SkipBack size={18} /></span><span>Reset</span
						></span
					>
				</div>
				<h3>Try another route</h3>
				<p>
					<strong>Undo</strong> takes back one move. <strong>Reset</strong> gives you your six starting
					numbers again. Experiment freely.
				</p>
			</section>
		</div>
		<section class="guide-scoring" aria-labelledby="scoring-title">
			<h3 id="scoring-title">Every step closer counts</h3>
			<div class="guide-score-grid">
				{#each [1, 2, 3] as count (count)}
					<div>
						<span class="guide-stars" aria-label={`${count} stars`}>
							{#each Array.from({ length: count }, (_, index) => index) as star (star)}<Star
									size={16}
									fill="currentColor"
								/>{/each}
						</span><strong>{count === 3 ? 'Exact match' : `Within ${count === 1 ? 25 : 10}`}</strong
						>
					</div>
				{/each}
			</div>
		</section>
		<div class="guide-solution">
			<span class="guide-solution-button" aria-hidden="true">Show Solution</span>
			<p>
				Stuck? See one way to reach the target. Revealing it stops you earning more stars on that
				puzzle.
			</p>
		</div>
		<footer>
			<button onclick={() => modal.set(false)}>Let’s play <ArrowRight size={18} /></button>
		</footer>
	</article>
</dialog>
