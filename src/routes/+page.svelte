<script>
	import '@picocss/pico/css/pico.css';
	import '$lib/app.css';
	import { modal, puzzleData, soundOn, theme } from '$lib/stores';
	import { getDateSeed } from '$lib/utils';
	import {
		Code,
		Heart,
		House,
		Info,
		Menu,
		Moon,
		Shield,
		Sun,
		Volume2,
		VolumeX,
		X
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import AdSlot from './adSlot.svelte';
	import Board from './board.svelte';
	import Instructions from './instructions.svelte';
	import UpdatePrompt from './updatePrompt.svelte';

	let menuOpen = $state(false);
	let menuPosition = $state({ left: 0, top: 0 });
	/** @type {HTMLUListElement} */
	let menuPanel;
	/** @type {HTMLButtonElement} */
	let menuButton;
	function positionMenu() {
		const bounds = menuButton.getBoundingClientRect();
		menuPosition = { left: bounds.left, top: bounds.bottom + 8 };
	}
	function openInstructions() {
		menuPanel.hidePopover();
		menuButton.focus();
		modal.set(true);
	}
	// The day is finished when every puzzle is solved or its solution shown. The ad slot appears
	// when that happens during this visit, so opening the page on a finished day shows no ad.
	const finished = $derived(
		$puzzleData.every((puzzle) => puzzle.revealed || puzzle.distance === 0)
	);
	let finishedOnOpen = $state(true);
	const adKey = $derived(finished && !finishedOnOpen ? `digits:${getDateSeed()}` : '');
	onMount(() => {
		// The board has already loaded the saved game: it mounts before this page does.
		finishedOnOpen = finished;
		try {
			const storedTheme = localStorage.getItem('theme');
			if (storedTheme === 'light' || storedTheme === 'dark') theme.set(storedTheme);
			if (localStorage.getItem('sound') === 'off') soundOn.set(false);
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
	function toggleSound() {
		soundOn.update((value) => !value);
		try {
			localStorage.setItem('sound', $soundOn ? 'on' : 'off');
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

<svelte:window onresize={() => menuPanel?.hidePopover()} />

<div class="app-shell">
	<header class="app-header">
		<div class="dropdown">
			<button
				bind:this={menuButton}
				class="icon-button menu-toggle"
				class:expanded={menuOpen}
				aria-label="Menu"
				aria-expanded={menuOpen}
				aria-controls="navigation-menu"
				popovertarget="navigation-menu"
				onclick={positionMenu}
			>
				<Menu size={22} class="menu-open-icon" /><X size={22} class="menu-close-icon" />
			</button>
			<ul
				bind:this={menuPanel}
				id="navigation-menu"
				class="menu-panel"
				popover="auto"
				style:left={`${menuPosition.left}px`}
				style:top={`${menuPosition.top}px`}
				ontoggle={(event) => (menuOpen = event.newState === 'open')}
			>
				<li><button onclick={openInstructions}><Info size={18} /> How to Play</button></li>
				<li>
					<a href="https://ihtfy.com" target="_blank" rel="noreferrer"><House size={18} /> IHTFY</a>
				</li>
				<li>
					<a href="https://github.com/IHTFY/digits" target="_blank" rel="noreferrer"
						><Code size={18} /> Code</a
					>
				</li>
				<li>
					<a href="https://ihtfy.com/support/" target="_blank" rel="noopener"
						><Heart size={18} /> Support</a
					>
				</li>
				<li>
					<a href="https://ihtfy.com/privacy" target="_blank" rel="noopener"
						><Shield size={18} /> Privacy</a
					>
				</li>
			</ul>
		</div>
		<strong>Digits</strong>
		<div class="header-actions">
			<button
				class="icon-button"
				onclick={toggleSound}
				aria-label={$soundOn ? 'Mute sounds' : 'Unmute sounds'}
			>
				{#if $soundOn}<Volume2 size={22} />{:else}<VolumeX size={22} />{/if}
			</button>
			<button
				class="icon-button"
				onclick={toggleTheme}
				aria-label={$theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
			>
				{#if $theme === 'light'}<Moon size={22} />{:else}<Sun size={22} />{/if}
			</button>
		</div>
	</header>
	<main><Board /></main>
</div>
{#if adKey}<AdSlot {adKey} />{/if}
<Instructions />
<UpdatePrompt />
