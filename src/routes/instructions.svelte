<script>
	import { modal } from '$lib/stores';
	import { onMount } from 'svelte';
	import { StarIcon } from 'svelte-feather-icons';

	const closeModal = () => {
		document.documentElement.classList.add('modal-is-closing');
		setTimeout(() => {
			document.documentElement.classList.remove('modal-is-closing', 'modal-is-open');
			modal.set(false);
		}, 400);
	};

	onMount(() => {
		// Close with a click outside
		document.addEventListener('click', (event) => {
			if ($modal && !document.documentElement.className.includes('modal-is-opening')) {
				const modalContent = document.querySelector('#instructions > article');
				const isClickInside = modalContent.contains(event.target);
				!isClickInside && closeModal();
			}
		});

		// Close with Esc key
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && $modal != null) {
				closeModal();
			}
		});
	});
</script>

<dialog open={$modal} id="instructions">
	<article>
		<header>
			<a href="#" on:click={closeModal} aria-label="Close" class="close" />
			How To Play
		</header>
		<p>Combine numbers to reach the Target Number.</p>
		<ul>
			<li>You don't need to use all 6 numbers</li>
			<li>Fractions and negative numbers are not allowed</li>
		</ul>
		<p>Earn more stars the closer you get to the Target Number</p>
		<ul class="stars">
			<li><StarIcon /> 25 away</li>
			<li><StarIcon /><StarIcon /> 10 away</li>
			<li><StarIcon /><StarIcon /><StarIcon /> Reaching the Target Number</li>
		</ul>
	</article>
</dialog>

<style>
	.stars li {
		list-style-type: none;
	}
</style>
