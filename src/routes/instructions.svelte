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
			<strong id="instructions-title">How to play</strong><button
				class="icon-button"
				aria-label="Close instructions"
				onclick={() => modal.set(false)}><X size={22} /></button
			>
		</header>
		<div class="guide-intro">
			<span class="guide-eyebrow">Five puzzles each day</span>
			<h2>Reach the target</h2>
			<p>Combine any of the six numbers to get as close to the target as you can.</p>
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
				<h3>Use the result</h3>
				<p>
					Each move replaces your two numbers with the result. You can use it again. You don't have
					to use all six numbers. Results must be whole numbers and cannot be negative.
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
				<h3>Undo or start over</h3>
				<p>
					<strong>Undo</strong> takes back your last move. <strong>Reset</strong> restores the six starting
					numbers.
				</p>
			</section>
		</div>
		<section class="guide-scoring" aria-labelledby="scoring-title">
			<h3 id="scoring-title">Earn stars</h3>
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
				Show Solution reveals one way to reach the target. You can keep playing, but you won't earn
				more stars for that puzzle.
			</p>
		</div>
		<footer>
			<button onclick={() => modal.set(false)}>Play <ArrowRight size={18} /></button>
		</footer>
	</article>
</dialog>
