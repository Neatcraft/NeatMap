<script lang="ts">
	import ActionButton from './ActionButton.svelte';

	type Action = 'add-event-item' | null;

	let offsetX = $state(0);
	let offsetY = $state(0);
	let isPanning = $state(false);
	let activeAction = $state<Action>(null);
	let lastX = 0;
	let lastY = 0;

	const KEYBOARD_STEP = 20;

	function selectAction(action: Action) {
		activeAction = activeAction === action ? null : action;
	}

	function onMouseDown(e: MouseEvent) {
		isPanning = true;
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

	function onMouseUp() {
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
</script>

<div
	class="relative h-full w-full overflow-hidden"
	style="background-color: #f7f7f7; background-image: radial-gradient(circle, #c4c4c4 1px, transparent 1px); background-size: 32px 32px; background-position: {offsetX}px {offsetY}px;"
>
	<canvas
		class="absolute inset-0 h-full w-full select-none"
		style="cursor: {isPanning ? 'grabbing' : 'grab'};"
		aria-label="Whiteboard canvas — use arrow keys or drag to navigate"
		tabindex="0"
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onmouseleave={onMouseUp}
		onkeydown={onKeyDown}
	></canvas>

	<aside
		class="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex flex-col gap-2 rounded-2xl bg-white px-3 py-4 shadow-md"
		aria-label="Action menu"
	>
		<ActionButton
			label="Add event item"
			color="#FFDCC6"
			iconColor="#C44500"
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