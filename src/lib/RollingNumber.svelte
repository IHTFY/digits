<script>
	import { onDestroy, untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	/** @type {{ value: number, animate?: boolean }} */
	let { value, animate = false } = $props();
	const number = new Tween(
		untrack(() => (animate ? 0 : value)),
		{
			duration: 250,
			easing: cubicOut
		}
	);
	/** @type {(() => void) | undefined} */
	let stop;

	export function cancel() {
		if (!stop) return;
		stop();
		stop = undefined;
		number.set(value, { duration: 0 });
	}

	/** @param {number} next */
	export async function rollTo(next) {
		stop?.();
		/** @type {() => void} */
		let cancelCurrent = () => {};
		const cancelled = new Promise((resolve) => {
			cancelCurrent = () => resolve(false);
		});
		stop = cancelCurrent;
		const duration =
			next === number.current || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250;
		const finished = number.set(next, { duration }).then(() => true);
		const completed = await Promise.race([finished, cancelled]);
		if (stop === cancelCurrent) stop = undefined;
		return completed;
	}

	$effect(() => {
		const next = value;
		untrack(() => {
			if (animate) rollTo(next);
			else {
				stop?.();
				stop = undefined;
				number.set(next, { duration: 0 });
			}
		});
	});

	onDestroy(() => {
		stop?.();
		number.set(number.current, { duration: 0 });
	});
</script>

<span class="rolling-number" aria-hidden="true">{Math.round(number.current)}</span>

<style>
	.rolling-number {
		font-variant-numeric: tabular-nums;
	}
</style>
