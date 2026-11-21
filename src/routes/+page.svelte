<script>
	import '@picocss/pico/css/pico.css';
	import '#lib/app.css';
	import { loadForBuyer } from '#lib/ads.js';
	import { modal, puzzleData, soundOn, theme } from '#lib/stores.js';
	import {
		Code,
		Gamepad2,
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
	import { onMount, tick } from 'svelte';
	import Board from './board.svelte';
	import Instructions from './instructions.svelte';
	import PlayAd from './playAd.svelte';
	import Results from './results.svelte';
	import UpdatePrompt from './updatePrompt.svelte';

	const RESULTS_DELAY = 1200;

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
	// The day is finished when every puzzle is solved or its solution shown. The results screen,
	// with the ad, replaces the board a moment after that happens during this visit, so opening
	// the page on a finished day shows neither. It comes once per visit; Review puzzles brings the
	// board back and removes the ad box.
	const finished = $derived(
		$puzzleData.every((puzzle) => puzzle.revealed || puzzle.distance === 0)
	);
	let finishedOnOpen = $state(true);
	let results = $state(false);
	let resultsShown = false;
	$effect(() => {
		if (!finished || finishedOnOpen || resultsShown || $modal) return;
		// The last tap has time to land before the screen changes under it.
		const timer = setTimeout(() => {
			resultsShown = true;
			results = true;
		}, RESULTS_DELAY);
		return () => clearTimeout(timer);
	});
	// The installed app's launch screen carries into the game: the blue folds into the tab of the
	// puzzle being played while the hash sign lands on its target.
	function launchIntoGame() {
		globalThis.launchExit?.((overlay) => {
			const fill = /** @type {HTMLElement} */ (overlay.querySelector('#launch-fill'));
			const icon = /** @type {SVGElement} */ (overlay.querySelector('#launch-icon'));
			const tab = /** @type {HTMLElement} */ (document.querySelector('.puzzle-tab.active'));
			const target = /** @type {HTMLElement} */ (document.querySelector('.target-number'));
			const tabBox = tab.getBoundingClientRect();
			const tabStyle = getComputedStyle(tab);
			const fold = `inset(${tabBox.top}px ${overlay.clientWidth - tabBox.right}px ${
				overlay.clientHeight - tabBox.bottom
			}px ${tabBox.left}px round ${tabStyle.borderRadius})`;
			/** @param {Element} from @param {Element} to @param {number} scale */
			const flight = (from, to, scale) => {
				const a = from.getBoundingClientRect();
				const b = to.getBoundingClientRect();
				const dx = b.left + b.width / 2 - (a.left + a.width / 2);
				const dy = b.top + b.height / 2 - (a.top + a.height / 2);
				return `translate(${dx}px, ${dy}px) scale(${scale})`;
			};
			// The hash is 20 of the icon's 24 units tall, drawn in 84 of its 128 px; it lands at
			// the height of the target's digits.
			const hashHeight = icon.getBoundingClientRect().height * (20 / 24) * (84 / 128);
			const targetDigits = parseFloat(getComputedStyle(target).fontSize) * 0.7;
			const brand = getComputedStyle(document.documentElement).getPropertyValue('--digits-brand');
			const timing = {
				duration: 900,
				easing: 'cubic-bezier(0.5, 0, 0.2, 1)',
				fill: /** @type {const} */ ('forwards')
			};
			// Each copy fades over the end of its flight, uncovering the real one underneath.
			const fadeOut = { opacity: [1, 1, 0], offset: [0, 0.75, 1] };
			return [
				fill.animate(
					{
						clipPath: ['inset(0 round 0)', fold],
						backgroundColor: ['#1095c1', tabStyle.backgroundColor]
					},
					timing
				),
				fill.animate(fadeOut, timing),
				icon.animate(
					{
						transform: ['none', flight(icon, target, targetDigits / hashHeight)],
						color: ['#fff', brand]
					},
					timing
				),
				icon.animate(fadeOut, timing)
			];
		});
	}
	onMount(() => {
		// The board and its saved tab render first: measure them once this update is drawn.
		tick().then(launchIntoGame);
		loadForBuyer();
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
	// The results screen goes away under the focused button: put focus on the board.
	async function review() {
		results = false;
		await tick();
		/** @type {HTMLElement | null} */
		const firstNumber = document.querySelector('.number-button:not([hidden])');
		firstNumber?.focus();
	}
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

<PlayAd>
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
						<a href="https://ihtfy.com" target="_blank" rel="noreferrer"
							><House size={18} /> IHTFY</a
						>
					</li>
					<li>
						<a href="https://github.com/IHTFY/digits" target="_blank" rel="noreferrer"
							><Code size={18} /> Code</a
						>
					</li>
					<li>
						<a href="https://ihtfy.com/projects/" target="_blank" rel="noopener"
							><Gamepad2 size={18} /> More games</a
						>
					</li>
					<li>
						<a href="https://ihtfy.com/privacy/" target="_blank" rel="noopener"
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
		<main hidden={results}><Board /></main>
		{#if results}<main class="results-screen"><Results onreview={review} /></main>{/if}
	</div>
</PlayAd>
<Instructions />
<UpdatePrompt />
