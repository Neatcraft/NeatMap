<script lang="ts">
	import { tick } from 'svelte';
	import ActionButton from './ActionButton.svelte';
	import EventCard from './EventCard.svelte';
	import type { BoardAction, EventItem, ItemType } from './types.js';

	let offsetX = $state(0);
	let offsetY = $state(0);
	let isPanning = $state(false);
	let activeAction = $state<BoardAction>(null);
	let items = $state<EventItem[]>([]);
	let draggingItemId = $state<string | null>(null);
	let selectedItemId = $state<string | null>(null);
	let boardEl = $state<HTMLElement | null>(null);

	let lastX = 0;
	let lastY = 0;
	let startX = 0;
	let startY = 0;
	let grabOffsetX = 0;
	let grabOffsetY = 0;

	const KEYBOARD_STEP = 20;
	const CLICK_THRESHOLD = 5;

	function selectAction(action: BoardAction) {
		activeAction = activeAction === action ? null : action;
	}

	// --- Board panning ---
	function onMouseDown(e: MouseEvent) {
		selectedItemId = null;
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
		if (!isPanning) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		const isClick = Math.sqrt(dx * dx + dy * dy) < CLICK_THRESHOLD;

		const typeByAction: Partial<Record<BoardAction, ItemType>> = {
			'add-event-item': 'event',
			'manage-commands': 'command',
			'add-actor': 'actor',
			'add-system': 'system',
			'add-data': 'data'
		};
		const itemType = activeAction ? typeByAction[activeAction] : null;

		if (isClick && itemType) {
			const rect = boardEl!.getBoundingClientRect();
			const id = crypto.randomUUID();
			items.push({
				id,
				x: e.clientX - rect.left - offsetX,
				y: e.clientY - rect.top - offsetY,
				label: '',
				exists: true,
				type: itemType
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

	// --- Item dragging ---
	function startItemDrag(e: MouseEvent, itemId: string) {
		const item = items.find((i) => i.id === itemId);
		if (!item || !boardEl) return;
		const rect = boardEl.getBoundingClientRect();
		grabOffsetX = e.clientX - rect.left - offsetX - item.x;
		grabOffsetY = e.clientY - rect.top - offsetY - item.y;
		draggingItemId = itemId;
		document.addEventListener('mousemove', onDragMove);
		document.addEventListener('mouseup', onDragEnd);
	}

	function onDragMove(e: MouseEvent) {
		const item = items.find((i) => i.id === draggingItemId);
		if (!item || !boardEl) return;
		const rect = boardEl.getBoundingClientRect();
		item.x = e.clientX - rect.left - offsetX - grabOffsetX;
		item.y = e.clientY - rect.top - offsetY - grabOffsetY;
	}

	function onDragEnd() {
		draggingItemId = null;
		document.removeEventListener('mousemove', onDragMove);
		document.removeEventListener('mouseup', onDragEnd);
	}

	function canvasCursor() {
		if (draggingItemId) return 'grabbing';
		if (activeAction) return 'crosshair';
		return isPanning ? 'grabbing' : 'grab';
	}
</script>

<div
	bind:this={boardEl}
	class="relative h-full w-full overflow-hidden"
	style="background-color: #F7F9FB; background-image: radial-gradient(circle, #D0D4DA 1px, transparent 1px); background-size: 32px 32px; background-position: {offsetX}px {offsetY}px;"
>
	<canvas
		class="absolute inset-0 h-full w-full select-none"
		style="cursor: {canvasCursor()};"
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
			<EventCard
				{item}
				isDragging={draggingItemId === item.id}
				isSelected={selectedItemId === item.id}
				onDragStart={(e) => startItemDrag(e, item.id)}
				onSelect={() => (selectedItemId = item.id)}
			/>
		{/each}
	</div>

	<aside
		class="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex flex-col gap-2 rounded-2xl bg-white px-3 py-4"
		style="box-shadow: 0 20px 25px -5px rgba(0,39,64,0.07), 0 8px 10px -6px rgba(0,39,64,0.05);"
		aria-label="Action menu"
	>
		<ActionButton
			label="Add event item"
			tooltip="Event"
			color="#FFDCC6"
			iconColor="#ED7D1A"
			isActive={activeAction === 'add-event-item'}
			onclick={() => selectAction('add-event-item')}
		>
			{#snippet icon()}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
					<path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
				</svg>
			{/snippet}
		</ActionButton>

		<ActionButton
			label="Manage commands"
			tooltip="Command"
			color="#DBEAFE"
			iconColor="#2663EB"
			isActive={activeAction === 'manage-commands'}
			onclick={() => selectAction('manage-commands')}
		>
			{#snippet icon()}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
					<path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clip-rule="evenodd" />
				</svg>
			{/snippet}
		</ActionButton>

		<ActionButton
			label="Add actor"
			tooltip="Actor"
			color="#FEF9C3"
			iconColor="#CA8A03"
			isActive={activeAction === 'add-actor'}
			onclick={() => selectAction('add-actor')}
		>
			{#snippet icon()}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
					<path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
				</svg>
			{/snippet}
		</ActionButton>

		<ActionButton
			label="Add system"
			tooltip="System"
			color="#FCE7F3"
			iconColor="#BE185D"
			isActive={activeAction === 'add-system'}
			onclick={() => selectAction('add-system')}
		>
			{#snippet icon()}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
					<path fill-rule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clip-rule="evenodd" />
				</svg>
			{/snippet}
		</ActionButton>

		<ActionButton
			label="Add data"
			tooltip="Data"
			color="#DCFCE7"
			iconColor="#16A34A"
			isActive={activeAction === 'add-data'}
			onclick={() => selectAction('add-data')}
		>
			{#snippet icon()}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
					<path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
					<path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
					<path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
					<path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
				</svg>
			{/snippet}
		</ActionButton>
	</aside>
</div>