import { boardState } from '../boardState.svelte.js';
import { connectionStore } from '../liaison/connectionStore.svelte.js';
import type { EventItem, ItemType } from '../types.js';

const SPACING = 160;
const HALF = 72;
const PAD = 32;
const GROUP_DISTANCE = 100;
const GROUPABLE: Partial<Record<ItemType, ItemType>> = { event: 'command', command: 'event' };

class GroupActions {
	draggingGroupId = $state<string | null>(null);
	targetId = $state<string | null>(null);
	joinTargetId = $state<string | null>(null);
	frozenPositions = $state<Record<string, { x: number; y: number }>>({});

	private dragLastX = 0;
	private dragLastY = 0;

	canJoin(item: EventItem, groupId: string): boolean {
		if (item.type === 'policy' || item.type === 'hot-spot') return false;
		if (item.type === 'actor' || item.type === 'data') return true;
		const group = boardState.groups.find((g) => g.id === groupId);
		if (!group) return false;
		return !group.itemIds.some((id) => boardState.items.find((i) => i.id === id)?.type === item.type);
	}

	findTarget(itemId: string): EventItem | null {
		const item = boardState.items.find((i) => i.id === itemId);
		if (!item || item.groupId) return null;
		const compatibleTypes: ItemType[] =
			item.type === 'actor' || item.type === 'system' || item.type === 'data'
				? ['event', 'command']
				: GROUPABLE[item.type] ? [GROUPABLE[item.type]!] : [];
		if (!compatibleTypes.length) return null;
		return (
			boardState.items.find(
				(other) =>
					other.id !== itemId &&
					!other.groupId &&
					compatibleTypes.includes(other.type) &&
					Math.hypot(item.x - other.x, item.y - other.y) < GROUP_DISTANCE
			) ?? null
		);
	}

	layout(groupId: string) {
		const group = boardState.groups.find((g) => g.id === groupId);
		if (!group) return;
		const gItems = group.itemIds
			.map((id) => boardState.items.find((i) => i.id === id))
			.filter((i): i is EventItem => i !== undefined);
		const evt = gItems.find((i) => i.type === 'event');
		const cmd = gItems.find((i) => i.type === 'command');
		const sys = gItems.find((i) => i.type === 'system');
		const actors = gItems.filter((i) => i.type === 'actor');
		const dataItems = gItems.filter((i) => i.type === 'data');
		const anchor = evt ?? cmd;
		if (!anchor) return;
		const ay = anchor.y;
		let curX = anchor.x;
		if (evt) { evt.x = curX; evt.y = ay; curX -= SPACING; }
		if (sys) { sys.x = anchor.x; sys.y = ay - SPACING; }
		if (cmd) { cmd.x = curX; cmd.y = ay; curX -= SPACING; }
		actors.forEach((actor, idx) => { actor.x = curX; actor.y = ay + idx * SPACING; });
		dataItems.forEach((data, idx) => { data.x = anchor.x; data.y = ay + SPACING * (idx + 1); });
	}

	boundsContain(partnerIds: string[], px: number, py: number): boolean {
		const positions = partnerIds
			.map((id) => this.frozenPositions[id] ?? boardState.items.find((i) => i.id === id))
			.filter((p): p is { x: number; y: number } => p !== undefined);
		if (!positions.length) return false;
		const minX = Math.min(...positions.map((p) => p.x)) - HALF - PAD;
		const maxX = Math.max(...positions.map((p) => p.x)) + HALF + PAD;
		const minY = Math.min(...positions.map((p) => p.y)) - HALF - PAD;
		const maxY = Math.max(...positions.map((p) => p.y)) + HALF + PAD;
		return px >= minX && px <= maxX && py >= minY && py <= maxY;
	}

	startDrag(e: MouseEvent, groupId: string) {
		if (!boardState.boardEl) return;
		const rect = boardState.boardEl.getBoundingClientRect();
		this.dragLastX = (e.clientX - rect.left - boardState.offsetX) / boardState.scale;
		this.dragLastY = (e.clientY - rect.top - boardState.offsetY) / boardState.scale;
		this.draggingGroupId = groupId;
		document.addEventListener('mousemove', this.onDragMove);
		document.addEventListener('mouseup', this.onDragEnd);
	}

	private onDragMove = (e: MouseEvent) => {
		const group = boardState.groups.find((g) => g.id === this.draggingGroupId);
		if (!group || !boardState.boardEl) return;
		const rect = boardState.boardEl.getBoundingClientRect();
		const wx = (e.clientX - rect.left - boardState.offsetX) / boardState.scale;
		const wy = (e.clientY - rect.top - boardState.offsetY) / boardState.scale;
		const dx = wx - this.dragLastX;
		const dy = wy - this.dragLastY;
		this.dragLastX = wx;
		this.dragLastY = wy;
		for (const id of group.itemIds) {
			const item = boardState.items.find((i) => i.id === id);
			if (item) { item.x += dx; item.y += dy; }
		}
	};

	private onDragEnd = () => {
		this.draggingGroupId = null;
		document.removeEventListener('mousemove', this.onDragMove);
		document.removeEventListener('mouseup', this.onDragEnd);
	};

	dissolve(groupId: string) {
		boardState.groups.find((g) => g.id === groupId)?.itemIds.forEach((id) => {
			const item = boardState.items.find((i) => i.id === id);
			if (item) item.groupId = undefined;
		});
		connectionStore.removeGroup(groupId);
		boardState.groups = boardState.groups.filter((g) => g.id !== groupId);
	}
}

export const groupActions = new GroupActions();
