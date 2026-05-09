<script lang="ts">
	import { tick, onMount } from 'svelte';
	import ActionButton from './ActionButton.svelte';
	import { EventCard, CommandCard, ActorCard, SystemCard, DataCard, PolicyCard, HotSpotCard, BoundedContext, GroupBackground } from './event-storming/index.js';
	import type { BoardAction, EventItem, FrameItem, Group, ItemType } from './types.js';

	const CARD_MAP: Record<ItemType, typeof EventCard> = {
		event: EventCard,
		command: CommandCard,
		actor: ActorCard,
		system: SystemCard,
		data: DataCard,
		policy: PolicyCard,
		'hot-spot': HotSpotCard
	};

	let offsetX = $state(0);
	let offsetY = $state(0);
	let scale = $state(1);
	let isPanning = $state(false);
	let isLeftDown = $state(false);
	let activeAction = $state<BoardAction>(null);
	let items = $state<EventItem[]>([]);
	let draggingItemId = $state<string | null>(null);
	let selectedItemId = $state<string | null>(null);
	let boardEl = $state<HTMLElement | null>(null);

	let frames = $state<FrameItem[]>([]);
	let draggingFrameId = $state<string | null>(null);
	let selectedFrameId = $state<string | null>(null);
	let resizingFrameId = $state<string | null>(null);

	let groups = $state<Group[]>([]);
	let groupTargetId = $state<string | null>(null);

	let lastX = 0;
	let lastY = 0;
	let startX = 0;
	let startY = 0;
	let grabOffsetX = 0;
	let grabOffsetY = 0;
	let frameGrabOffsetX = 0;
	let frameGrabOffsetY = 0;
	let draggedFrameItemIds: string[] = [];
	let draggedGroupItemIds: string[] = [];
	let resizeStartW = 0;
	let resizeStartH = 0;
	let resizeStartX = 0;
	let resizeStartY = 0;

	const KEYBOARD_STEP = 20;
	const CLICK_THRESHOLD = 5;
	const GROUP_DISTANCE = 100;
	const GROUPABLE: Partial<Record<ItemType, ItemType>> = { event: 'command', command: 'event' };

	function findGroupTarget(itemId: string): EventItem | null {
		const item = items.find((i) => i.id === itemId);
		if (!item || item.groupId) return null;
		const compatibleType = GROUPABLE[item.type];
		if (!compatibleType) return null;
		return items.find(
			(other) =>
				other.id !== itemId &&
				!other.groupId &&
				other.type === compatibleType &&
				Math.hypot(item.x - other.x, item.y - other.y) < GROUP_DISTANCE
		) ?? null;
	}

	function deleteItem(id: string) {
		const item = items.find((i) => i.id === id);
		if (item?.groupId) {
			const gid = item.groupId;
			items.forEach((i) => { if (i.groupId === gid) i.groupId = undefined; });
			groups = groups.filter((g) => g.id !== gid);
		}
		items = items.filter((i) => i.id !== id);
		selectedItemId = null;
	}

	function deleteFrame(id: string) {
		frames = frames.filter((f) => f.id !== id);
		selectedFrameId = null;
	}

	onMount(() => {
		function handleDelete(e: KeyboardEvent) {
			if (e.key !== 'Delete' && e.key !== 'Backspace') return;
			const target = e.target as HTMLElement;
			if (target.isContentEditable) return;
			if (selectedItemId) deleteItem(selectedItemId);
			else if (selectedFrameId) deleteFrame(selectedFrameId);
		}
		document.addEventListener('keydown', handleDelete);
		return () => document.removeEventListener('keydown', handleDelete);
	});

	function selectAction(action: BoardAction) {
		activeAction = activeAction === action ? null : action;
	}

	// --- Board panning (right-click drag) + left-click creation ---
	function onMouseDown(e: MouseEvent) {
		if (e.button === 2) {
			isPanning = true;
			lastX = e.clientX;
			lastY = e.clientY;
			startX = e.clientX;
			startY = e.clientY;
		} else if (e.button === 0) {
			selectedItemId = null;
			selectedFrameId = null;
			isLeftDown = true;
			startX = e.clientX;
			startY = e.clientY;
		}
	}

	function onMouseMove(e: MouseEvent) {
		if (!isPanning) return;
		offsetX += e.clientX - lastX;
		offsetY += e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	async function onMouseUp(e: MouseEvent) {
		if (e.button === 2) {
			isPanning = false;
			return;
		}
		if (e.button !== 0 || !isLeftDown) return;
		isLeftDown = false;

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		const isClick = Math.sqrt(dx * dx + dy * dy) < CLICK_THRESHOLD;

		if (isClick && activeAction === 'add-frame') {
			const rect = boardEl!.getBoundingClientRect();
			const id = crypto.randomUUID();
			const wx = (e.clientX - rect.left - offsetX) / scale;
			const wy = (e.clientY - rect.top - offsetY) / scale;
			frames.push({ id, x: wx - 175, y: wy - 125, width: 350, height: 250, label: '' });
			selectedFrameId = id;
		}

		const typeByAction: Partial<Record<BoardAction, ItemType>> = {
			'add-event-item': 'event',
			'manage-commands': 'command',
			'add-actor': 'actor',
			'add-system': 'system',
			'add-data': 'data',
			'add-policy': 'policy',
			'add-hot-spot': 'hot-spot'
		};
		const itemType = activeAction ? typeByAction[activeAction] : null;

		if (isClick && itemType) {
			const rect = boardEl!.getBoundingClientRect();
			const id = crypto.randomUUID();
			items.push({
				id,
				x: (e.clientX - rect.left - offsetX) / scale,
				y: (e.clientY - rect.top - offsetY) / scale,
				label: '',
				exists: true,
				type: itemType
			});
			await tick();
			document.getElementById(`item-${id}`)?.focus();
		}
	}

	function onMouseLeave() {
		isPanning = false;
		isLeftDown = false;
	}

	function onContextMenu(e: MouseEvent) {
		e.preventDefault();
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const rect = boardEl!.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
		const newScale = Math.max(0.1, Math.min(5, scale * factor));
		offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
		offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
		scale = newScale;
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

	// --- Frame dragging ---
	function itemInsideFrame(item: EventItem, frame: FrameItem): boolean {
		return (
			item.x >= frame.x &&
			item.x <= frame.x + frame.width &&
			item.y >= frame.y &&
			item.y <= frame.y + frame.height
		);
	}

	function startFrameDrag(e: MouseEvent, frameId: string) {
		const frame = frames.find((f) => f.id === frameId);
		if (!frame || !boardEl) return;
		const rect = boardEl.getBoundingClientRect();
		frameGrabOffsetX = (e.clientX - rect.left - offsetX) / scale - frame.x;
		frameGrabOffsetY = (e.clientY - rect.top - offsetY) / scale - frame.y;
		draggedFrameItemIds = items.filter((i) => itemInsideFrame(i, frame)).map((i) => i.id);
		draggingFrameId = frameId;
		document.addEventListener('mousemove', onFrameDragMove);
		document.addEventListener('mouseup', onFrameDragEnd);
	}

	function onFrameDragMove(e: MouseEvent) {
		const frame = frames.find((f) => f.id === draggingFrameId);
		if (!frame || !boardEl) return;
		const rect = boardEl.getBoundingClientRect();
		const newX = (e.clientX - rect.left - offsetX) / scale - frameGrabOffsetX;
		const newY = (e.clientY - rect.top - offsetY) / scale - frameGrabOffsetY;
		const dx = newX - frame.x;
		const dy = newY - frame.y;
		frame.x = newX;
		frame.y = newY;
		for (const id of draggedFrameItemIds) {
			const item = items.find((i) => i.id === id);
			if (item) { item.x += dx; item.y += dy; }
		}
	}

	function onFrameDragEnd() {
		draggingFrameId = null;
		draggedFrameItemIds = [];
		document.removeEventListener('mousemove', onFrameDragMove);
		document.removeEventListener('mouseup', onFrameDragEnd);
	}

	// --- Frame resizing ---
	function startFrameResize(e: MouseEvent, frameId: string) {
		const frame = frames.find((f) => f.id === frameId);
		if (!frame) return;
		resizeStartW = frame.width;
		resizeStartH = frame.height;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizingFrameId = frameId;
		document.addEventListener('mousemove', onFrameResizeMove);
		document.addEventListener('mouseup', onFrameResizeEnd);
	}

	function onFrameResizeMove(e: MouseEvent) {
		const frame = frames.find((f) => f.id === resizingFrameId);
		if (!frame) return;
		frame.width = Math.max(150, resizeStartW + (e.clientX - resizeStartX) / scale);
		frame.height = Math.max(100, resizeStartH + (e.clientY - resizeStartY) / scale);
	}

	function onFrameResizeEnd() {
		resizingFrameId = null;
		document.removeEventListener('mousemove', onFrameResizeMove);
		document.removeEventListener('mouseup', onFrameResizeEnd);
	}

	// --- Item dragging ---
	function startItemDrag(e: MouseEvent, itemId: string) {
		const item = items.find((i) => i.id === itemId);
		if (!item || !boardEl) return;
		const rect = boardEl.getBoundingClientRect();
		grabOffsetX = (e.clientX - rect.left - offsetX) / scale - item.x;
		grabOffsetY = (e.clientY - rect.top - offsetY) / scale - item.y;
		draggingItemId = itemId;
		draggedGroupItemIds = item.groupId
			? (groups.find((g) => g.id === item.groupId)?.itemIds ?? [])
			: [];
		document.addEventListener('mousemove', onDragMove);
		document.addEventListener('mouseup', onDragEnd);
	}

	function onDragMove(e: MouseEvent) {
		const item = items.find((i) => i.id === draggingItemId);
		if (!item || !boardEl) return;
		const rect = boardEl.getBoundingClientRect();
		const newX = (e.clientX - rect.left - offsetX) / scale - grabOffsetX;
		const newY = (e.clientY - rect.top - offsetY) / scale - grabOffsetY;

		if (draggedGroupItemIds.length > 1) {
			const dx = newX - item.x;
			const dy = newY - item.y;
			for (const id of draggedGroupItemIds) {
				const gi = items.find((i) => i.id === id);
				if (gi) { gi.x += dx; gi.y += dy; }
			}
		} else {
			item.x = newX;
			item.y = newY;
			groupTargetId = findGroupTarget(item.id)?.id ?? null;
		}
	}

	function onDragEnd() {
		if (groupTargetId && draggingItemId) {
			const item = items.find((i) => i.id === draggingItemId);
			const target = items.find((i) => i.id === groupTargetId);
			if (item && target) {
				const gid = crypto.randomUUID();
				const cx = (item.x + target.x) / 2;
				const cy = (item.y + target.y) / 2;
				const [cmd, evt] = item.type === 'command' ? [item, target] : [target, item];
				cmd.x = cx - 80; cmd.y = cy;
				evt.x = cx + 80; evt.y = cy;
				cmd.groupId = gid;
				evt.groupId = gid;
				groups.push({ id: gid, itemIds: [cmd.id, evt.id] });
			}
		}
		groupTargetId = null;
		draggingItemId = null;
		draggedGroupItemIds = [];
		document.removeEventListener('mousemove', onDragMove);
		document.removeEventListener('mouseup', onDragEnd);
	}

	function canvasCursor() {
		if (draggingItemId || draggingFrameId || isPanning) return 'grabbing';
		if (resizingFrameId) return 'se-resize';
		if (activeAction) return 'crosshair';
		return 'default';
	}
</script>

<div
	bind:this={boardEl}
	class="relative h-full w-full overflow-hidden"
	style="background-color: #F7F9FB; background-image: radial-gradient(circle, #D0D4DA 1px, transparent 1px); background-size: {32 * scale}px {32 * scale}px; background-position: {offsetX}px {offsetY}px;"
>
	<canvas
		class="absolute inset-0 h-full w-full select-none"
		style="cursor: {canvasCursor()};"
		aria-label="Whiteboard canvas — use arrow keys or drag to navigate"
		tabindex="0"
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onmouseleave={onMouseLeave}
		oncontextmenu={onContextMenu}
		onwheel={onWheel}
		onkeydown={onKeyDown}
	></canvas>

	<div
		class="pointer-events-none absolute inset-0 z-5"
		style="transform: translate({offsetX}px, {offsetY}px) scale({scale}); transform-origin: 0 0;"
	>
		{#each frames as frame (frame.id)}
			<BoundedContext
				{frame}
				isSelected={selectedFrameId === frame.id}
				isDragging={draggingFrameId === frame.id}
				interactive={activeAction === null}
				onDragStart={(e) => startFrameDrag(e, frame.id)}
				onResizeStart={(e) => startFrameResize(e, frame.id)}
				onSelect={() => (selectedFrameId = frame.id)}
				onDelete={() => deleteFrame(frame.id)}
			/>
		{/each}

		{#each groups as group (group.id)}
			{@const groupItems = group.itemIds.map((id) => items.find((i) => i.id === id)).filter((i) => i !== undefined)}
			{#if groupItems.length === group.itemIds.length}
				<GroupBackground items={groupItems} />
			{/if}
		{/each}

		{#if groupTargetId}
			{@const target = items.find((i) => i.id === groupTargetId)}
			{#if target}
				<div
					class="absolute pointer-events-none z-30"
					style="left: {target.x}px; top: {target.y}px; width: 144px; height: 144px; transform: translate(-50%, -50%); box-shadow: 0 0 0 4px #002740, 0 0 20px rgba(0,39,64,0.4); border-radius: 0;"
				></div>
			{/if}
		{/if}

		{#each items as item (item.id)}
			{@const CardComponent = CARD_MAP[item.type]}
			<CardComponent
				{item}
				isDragging={draggingItemId === item.id}
				isSelected={selectedItemId === item.id}
				onDragStart={(e) => startItemDrag(e, item.id)}
				onSelect={() => (selectedItemId = item.id)}
				onDelete={() => deleteItem(item.id)}
			/>
		{/each}
	</div>

	<aside
		class="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex flex-col gap-2 rounded-2xl bg-white px-3 py-4"
		style="box-shadow: 0 20px 25px -5px rgba(0,39,64,0.07), 0 8px 10px -6px rgba(0,39,64,0.05);"
		aria-label="Action menu"
	>
		<ActionButton
			label="Add bounded context"
			tooltip="Bounded Context"
			color="#F1F5F9"
			iconColor="#64748B"
			isActive={activeAction === 'add-frame'}
			onclick={() => selectAction('add-frame')}
		>
			{#snippet icon()}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
					<path fill-rule="evenodd" d="M1.5 7.125c0-1.036.84-1.875 1.875-1.875h6c1.036 0 1.875.84 1.875 1.875v3.75c0 1.035-.84 1.875-1.875 1.875h-6A1.875 1.875 0 0 1 1.5 10.875v-3.75Zm12 1.5c0-1.036.84-1.875 1.875-1.875h5.25c1.035 0 1.875.84 1.875 1.875v8.25c0 1.035-.84 1.875-1.875 1.875h-5.25a1.875 1.875 0 0 1-1.875-1.875v-8.25ZM3 16.125c0-1.036.84-1.875 1.875-1.875h5.25c1.035 0 1.875.84 1.875 1.875v2.25c0 1.035-.84 1.875-1.875 1.875h-5.25A1.875 1.875 0 0 1 3 18.375v-2.25Z" clip-rule="evenodd" />
				</svg>
			{/snippet}
		</ActionButton>

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

		<ActionButton
			label="Add policy"
			tooltip="Policy"
			color="#EDE9FE"
			iconColor="#7C3AED"
			isActive={activeAction === 'add-policy'}
			onclick={() => selectAction('add-policy')}
		>
			{#snippet icon()}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
					<path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clip-rule="evenodd" />
					<path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
				</svg>
			{/snippet}
		</ActionButton>

		<ActionButton
			label="Add hot spot"
			tooltip="Hot Spot"
			color="#FAE8FF"
			iconColor="#A21CAF"
			isActive={activeAction === 'add-hot-spot'}
			onclick={() => selectAction('add-hot-spot')}
		>
			{#snippet icon()}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
					<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75S21.75 6.615 21.75 12s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
				</svg>
			{/snippet}
		</ActionButton>
	</aside>
</div>