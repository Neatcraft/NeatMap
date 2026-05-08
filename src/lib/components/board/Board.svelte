<script lang="ts">
	import { tick } from 'svelte';
	import ActionButton from './ActionButton.svelte';

	interface EventItem {
		id: string;
		x: number;
		y: number;
		label: string;
	}

	type Action = 'add-event-item' | null;

	let offsetX = $state(0);
	let offsetY = $state(0);
	let isPanning = $state(false);
	let activeAction = $state<Action>(null);
	let items = $state<EventItem[]>([]);
	let lastX = 0;
	let lastY = 0;
	let startX = 0;
	let startY = 0;

	const KEYBOARD_STEP = 20;
	const CLICK_THRESHOLD = 5;

	function selectAction(action: Action) {
		activeAction = activeAction === action ? null : action;
	}

	function onMouseDown(e: MouseEvent) {
		isPanning = true;
		startX = e.clientX;
		startY = e.clientY;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function onMouseMove(e: MouseEvent) {
		if (!isPanning) return;
		offsetX += e.clientX - lastX;
		offsetY += e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	async function onMouseUp(e: MouseEvent) {
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		const isClick = Math.sqrt(dx * dx + dy * dy) < CLICK_THRESHOLD;

		if (isClick && activeAction === 'add-event-item') {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const id = crypto.randomUUID();
			items.push({
				id,
				x: e.clientX - rect.left - offsetX,
				y: e.clientY - rect.top - offsetY,
				label: ''
			});
			await tick();
			document.getElementById(`item-${id}`)?.focus();
		}

		isPanning = false;
	}

	function onKeyDown(e: KeyboardEvent) {
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [KEYBOARD_STEP, 0],
			ArrowRight: [-KEYBOARD_STEP, 0],
			ArrowUp: [0, KEYBOARD_STEP],
			ArrowDown: [0, -KEYBOARD_STEP]
		};
		const move = moves[e.key];
		if (!move) return;
		e.preventDefault();
		offsetX += move[0];
		offsetY += move[1];
	}

	function cursor() {
		if (activeAction === 'add-event-item') return 'crosshair';
		return isPanning ? 'grabbing' : 'grab';
	}
</script>

<div
	class="relative h-full w-full overflow-hidden"
	style="background-color: #F7F9FB; background-image: radial-gradient(circle, #D0D4DA 1px, transparent 1px); background-size: 32px 32px; background-position: {offsetX}px {offsetY}px;"
>
	<canvas
		class="absolute inset-0 h-full w-full select-none"
		style="cursor: {cursor()};"
		aria-label="Whiteboard canvas — use arrow keys or drag to navigate"
		tabindex="0"
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onmouseleave={onMouseUp}
		onkeydown={onKeyDown}
	></canvas>

	<div
		class="pointer-events-none absolute inset-0 z-5"
		style="transform: translate({offsetX}px, {offsetY}px);"
	>
		{#each items as item (item.id)}
			<article
				class="pointer-events-auto absolute size-36 -translate-x-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center p-3"
				style="left: {item.x}px; top: {item.y}px; background-color: #FFDCC6; box-shadow: 0 20px 25px -5px rgba(0,39,64,0.07), 0 8px 10px -6px rgba(0,39,64,0.05);"
			>
				<div
					id="item-{item.id}"
					class="w-full cursor-text text-sm text-black text-center outline-none empty:before:text-black/30 empty:before:content-['Domain_Event'] font-montserrat font-medium"
					contenteditable="true"
					role="textbox"
					aria-label="Event item label"
					aria-multiline="true"
					bind:textContent={item.label}
				></div>
			</article>
		{/each}
	</div>

	<aside
		class="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex flex-col gap-2 rounded-2xl bg-white px-3 py-4"
		style="box-shadow: 0 20px 25px -5px rgba(0,39,64,0.07), 0 8px 10px -6px rgba(0,39,64,0.05);"
		aria-label="Action menu"
	>
		<ActionButton
			label="Add event item"
			color="#FFDCC6"
			iconColor="#ED7D1A"
			isActive={activeAction === 'add-event-item'}
			onclick={() => selectAction('add-event-item')}
		>
			{#snippet icon()}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="h-5 w-5"
				>
					<path
						fill-rule="evenodd"
						d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
						clip-rule="evenodd"
					/>
				</svg>
			{/snippet}
		</ActionButton>
	</aside>
</div>