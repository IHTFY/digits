<script>
	import '@picocss/pico/css/pico.css';
	import '$lib/app.css';
	import { modal, theme } from '$lib/stores';
	import { Code, House, Info, Menu, Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import Board from './board.svelte';
	import Instructions from './instructions.svelte';
	import UpdatePrompt from './updatePrompt.svelte';

	let menuOpen = $state(false);
	onMount(() => {
		try {
			const storedTheme = localStorage.getItem('theme');
			if (storedTheme === 'light' || storedTheme === 'dark') theme.set(storedTheme);
		} catch {
			/* Play without a stored preference. */
		}
	});
	$effect(() => {
		document.documentElement.setAttribute('data-theme', $theme);
	});
	function toggleTheme() {
		theme.update((value) => (value === 'dark' ? 'light' : 'dark'));
		try {
			localStorage.setItem('theme', $theme);
		} catch {
			/* Optional preference. */
		}
	}
</script>

<svelte:head>
	<title>Digits</title>
	<meta
		name="description"
		content="Combine six numbers to reach the target. Five new puzzles every day."
	/>
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<details class="dropdown" bind:open={menuOpen}>
			<summary class="icon-button" aria-label="Menu"><Menu size={22} /></summary>
			<ul>
				<li>
					<button
						onclick={() => {
							menuOpen = false;
							modal.set(true);
						}}><Info size={18} /> How to Play</button
					>
				</li>
				<li>
					<a href="https://ihtfy.com" target="_blank" rel="noreferrer"><House size={18} /> IHTFY</a>
				</li>
				<li>
					<a href="https://github.com/IHTFY/digits" target="_blank" rel="noreferrer"
						><Code size={18} /> Code</a
					>
				</li>
			</ul>
		</details>
		<strong>Digits</strong>
		<button
			class="icon-button"
			onclick={toggleTheme}
			aria-label={$theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
		>
			{#if $theme === 'light'}<Moon size={22} />{:else}<Sun size={22} />{/if}
		</button>
	</header>
	<main><Board /></main>
</div>
<Instructions />
<UpdatePrompt />
