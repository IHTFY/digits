<script>
	import { modal, theme } from '$lib/stores';
	import '@picocss/pico';
	import {
		GithubIcon,
		HomeIcon,
		InfoIcon,
		MenuIcon,
		MoonIcon,
		SunIcon
	} from 'svelte-feather-icons';

	import Board from './board.svelte';
	import Instructions from './instructions.svelte';

	import { onMount } from 'svelte';

	let openModal = () => {};
	onMount(() => {
		const storedTheme = window.localStorage.getItem('theme');
		theme.update((val) => storedTheme || val);
		document.documentElement.setAttribute('data-theme', $theme);

		openModal = () => {
			document.documentElement.classList.add('modal-is-open', 'modal-is-opening');
			setTimeout(() => {
				document.documentElement.classList.remove('modal-is-opening');
			}, 400);
			modal.set(true);
		};
	});

	const toggleTheme = () => {
		theme.update((val) => (val === 'dark' ? 'light' : 'dark'));
		window.localStorage.setItem('theme', $theme);
		document.documentElement.setAttribute('data-theme', $theme);
	};

	let showInstructions = false;
</script>

<svelte:head>
	<title>Digits</title>
</svelte:head>
<div class="container">
	<nav>
		<ul>
			<li role="list">
				<!-- svelte-ignore a11y-missing-attribute -->
				<a aria-haspopup="listbox"> <MenuIcon /></a>
				<ul role="listbox">
					<li>
						<!-- svelte-ignore a11y-missing-attribute -->
						<a href="#HowToPlay" on:click={openModal}><InfoIcon /> How to Play</a>
					</li>
					<li>
						<a href="https://ihtfy.com" target="_blank"><HomeIcon /> IHTFY</a>
					</li>
					<li>
						<a href="https://github.com/IHTFY/digits" target="_blank" class="secondary"
							><GithubIcon /> Code</a
						>
					</li>
				</ul>
			</li>
		</ul>
		<ul>
			<li><strong>Digits</strong></li>
		</ul>
		<ul>
			<li>
				<!-- svelte-ignore a11y-missing-attribute  a11y-click-events-have-key-events a11y-no-static-element-interactions -->
				<a on:click={toggleTheme}>
					{#if $theme === 'light'}
						<MoonIcon />
					{:else}
						<SunIcon />
					{/if}
				</a>
			</li>
		</ul>
	</nav>
	<div>
		<Board />
	</div>
</div>

<Instructions />
