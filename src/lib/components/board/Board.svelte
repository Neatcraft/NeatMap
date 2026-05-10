<script lang="ts">
	import { onMount } from 'svelte';
	import {
		EventCard, CommandCard, ActorCard, SystemCard, DataCard, PolicyCard, HotSpotCard,
		BoundedContext, GroupBackground
	} from './event-storming/index.js';
	import type { BoardAction, EventItem, ItemType } from './types.js';
	import { boardState } from './boardState.svelte.js';
	import { navActions } from './actions/navActions.svelte.js';
	import { frameActions } from './actions/frameActions.svelte.js';
	import { groupActions } from './actions/groupActions.svelte.js';
	import { itemActions } from './actions/itemActions.svelte.js';
	import { connectionStore } from './liaison/connectionStore.svelte.js';
	import GroupConnectionLayer from './liaison/GroupConnectionLayer.svelte';
	import BoardToolbar from './BoardToolbar.svelte';

	const CARD_MAP: Record<ItemType, typeof EventCard> = {
		event: EventCard,
		command: CommandCard,
		actor: ActorCard,
		system: SystemCard,
		data: DataCard,
		policy: PolicyCard,
		'hot-spot': HotSpotCard
	};

	const CLICK_THRESHOLD = 5;
	const TYPE_BY_ACTION: Partial<Record<NonNullable<BoardAction>, ItemType>> = {
		'add-event-item': 'event',
		'manage-commands': 'command',
		'add-actor': 'actor',
		'add-system': 'system',
		'add-data': 'data',
		'add-policy': 'policy',
		'add-hot-spot': 'hot-spot'
	};

	const connectables = $derived([
		...boardState.groups
			.map((g) => ({
				id: g.id,
				items: g.itemIds
					.map((id) => boardState.items.find((i) => i.id === id))
					.filter((i): i is EventItem => i !== undefined)
			}))
			.filter((g) => g.items.length > 0),
		...boardState.items
			.filter((i) => i.type === 'policy')
			.map((i) => ({ id: i.id, items: [i] }))
	]);

	onMount(() => {
		function handleDelete(e: KeyboardEvent) {
			if (e.key !== 'Delete' && e.key !== 'Backspace') return;
			if ((e.target as HTMLElement).isContentEditable) return;
			if (boardState.selectedItemId) itemActions.delete(boardState.selectedItemId);
			else if (boardState.selectedFrameId) frameActions.delete(boardState.selectedFrameId);
			else if (connectionStore.selectedId) connectionStore.deleteSelected();
		}
		document.addEventListener('keydown', handleDelete);
		return () => document.removeEventListener('keydown', handleDelete);
	});

	function onMouseDown(e: MouseEvent) {
		if (connectionStore.connectingFrom) { connectionStore.cancel(); return; }
		if (e.button === 2) {
			navActions.startPan(e);
		} else if (e.button === 0) {
			boardState.selectedItemId = null;
			boardState.selectedFrameId = null;
			connectionStore.deselect();
			navActions.startClick(e);
		}
	}

	function onMouseMove(e: MouseEvent) {
		if (connectionStore.connectingFrom && boardState.boardEl) {
			const rect = boardState.boardEl.getBoundingClientRect();
			connectionStore.updateMouse(
				(e.clientX - rect.left - boardState.offsetX) / boardState.scale,
				(e.clientY - rect.top - boardState.offsetY) / boardState.scale
			);
		}
		navActions.pan(e);
	}

	async function onMouseUp(e: MouseEvent) {
		if (e.button === 2) { navActions.endPan(); return; }
		if (e.button !== 0 || !navActions.isLeftDown) return;
		navActions.endClick();

		const dx = e.clientX - navActions.startX;
		const dy = e.clientY - navActions.startY;
		if (Math.sqrt(dx * dx + dy * dy) >= CLICK_THRESHOLD) return;

		if (boardState.activeAction === 'add-frame') { frameActions.create(e); return; }
		const itemType = boardState.activeAction ? TYPE_BY_ACTION[boardState.activeAction] : null;
		if (itemType) await itemActions.create(e, itemType);
	}

	function canvasCursor() {
		if (connectionStore.connectingFrom) return 'crosshair';
		if (
			itemActions.draggingItemId || frameActions.draggingFrameId ||
			groupActions.draggingGroupId || navActions.isPanning
		) return 'grabbing';
		if (frameActions.resizingFrameId) return 'se-resize';
		if (boardState.activeAction) return 'crosshair';
		return 'default';
	}
</script>

<div
	bind:this={boardState.boardEl}
	class="relative h-full w-full overflow-hidden"
	style="background-color: #F7F9FB; background-image: radial-gradient(circle, #D0D4DA 1px, transparent 1px); background-size: {32 * boardState.scale}px {32 * boardState.scale}px; background-position: {boardState.offsetX}px {boardState.offsetY}px;"
>
	<canvas
		class="absolute inset-0 h-full w-full select-none"
		style="cursor: {canvasCursor()};"
		aria-label="Whiteboard canvas — use arrow keys or drag to navigate"
		tabindex="0"
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onmouseleave={() => navActions.reset()}
		oncontextmenu={(e) => e.preventDefault()}
		onwheel={(e) => navActions.zoom(e)}
		onkeydown={(e) => navActions.keyboard(e)}
	></canvas>

	<div
		class="pointer-events-none absolute inset-0 z-5"
		style="transform: translate({boardState.offsetX}px, {boardState.offsetY}px) scale({boardState.scale}); transform-origin: 0 0;"
	>
		{#each boardState.frames as frame (frame.id)}
			<BoundedContext
				{frame}
				isSelected={boardState.selectedFrameId === frame.id}
				isDragging={frameActions.draggingFrameId === frame.id}
				interactive={boardState.activeAction === null}
				onDragStart={(e) => frameActions.startDrag(e, frame.id)}
				onResizeStart={(e) => frameActions.startResize(e, frame.id)}
				onSelect={() => (boardState.selectedFrameId = frame.id)}
				onDelete={() => frameActions.delete(frame.id)}
			/>
		{/each}

		{#each boardState.groups as group (group.id)}
			{@const groupItems = group.itemIds
				.map((id) => boardState.items.find((i) => i.id === id))
				.filter((i) => i !== undefined)}
			{#if groupItems.length === group.itemIds.length}
				{@const isFrozen = groupItems.some((i) => i.id in groupActions.frozenPositions)}
				{@const displayItems = isFrozen
					? groupItems.map((i) => ({ ...i, ...(groupActions.frozenPositions[i.id] ?? {}) }))
					: groupItems}
				<GroupBackground
					items={displayItems}
					isDragging={groupActions.draggingGroupId === group.id}
					isJoinTarget={groupActions.joinTargetId === group.id}
					onDragStart={(e) => groupActions.startDrag(e, group.id)}
				/>
			{/if}
		{/each}

		{#if groupActions.targetId}
			{@const target = boardState.items.find((i) => i.id === groupActions.targetId)}
			{#if target}
				<div
					class="absolute pointer-events-none z-30"
					style="left: {target.x}px; top: {target.y}px; width: 144px; height: 144px; transform: translate(-50%, -50%); box-shadow: 0 0 0 4px #002740, 0 0 20px rgba(0,39,64,0.4); border-radius: 0;"
				></div>
			{/if}
		{/if}

		{#each boardState.items as item (item.id)}
			{@const CardComponent = CARD_MAP[item.type]}
			<CardComponent
				{item}
				isDragging={itemActions.draggingItemId === item.id}
				isSelected={boardState.selectedItemId === item.id}
				onDragStart={(e) => itemActions.startDrag(e, item.id)}
				onSelect={() => (boardState.selectedItemId = item.id)}
				onDelete={() => itemActions.delete(item.id)}
			/>
		{/each}

		<GroupConnectionLayer groups={connectables} />
	</div>

	<BoardToolbar
		activeAction={boardState.activeAction}
		onSelect={(action) => {
			boardState.activeAction = boardState.activeAction === action ? null : action;
		}}
	/>
</div>
