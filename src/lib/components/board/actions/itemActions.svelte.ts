import { tick } from 'svelte';
import { boardState } from '../boardState.svelte.js';
import { groupActions } from './groupActions.svelte.js';
import { connectionStore } from '../liaison/connectionStore.svelte.js';
import type { EventItem, ItemType } from '../types.js';

const HALF = 72;
const PAD = 32;

class ItemActions {
	draggingItemId = $state<string | null>(null);

	private grabOffsetX = 0;
	private grabOffsetY = 0;

	startDrag(e: MouseEvent, itemId: string) {
		const item = boardState.items.find((i) => i.id === itemId);
		if (!item || !boardState.boardEl) return;
		const rect = boardState.boardEl.getBoundingClientRect();
		this.grabOffsetX = (e.clientX - rect.left - boardState.offsetX) / boardState.scale - item.x;
		this.grabOffsetY = (e.clientY - rect.top - boardState.offsetY) / boardState.scale - item.y;
		this.draggingItemId = itemId;
		if (item.groupId) {
			const group = boardState.groups.find((g) => g.id === item.groupId);
			if (group) {
				const snap: Record<string, { x: number; y: number }> = {};
				for (const id of group.itemIds) {
					const gi = boardState.items.find((i) => i.id === id);
					if (gi) snap[id] = { x: gi.x, y: gi.y };
				}
				groupActions.frozenPositions = snap;
			}
		}
		document.addEventListener('mousemove', this.onDragMove);
		document.addEventListener('mouseup', this.onDragEnd);
	}

	private onDragMove = (e: MouseEvent) => {
		const item = boardState.items.find((i) => i.id === this.draggingItemId);
		if (!item || !boardState.boardEl) return;
		const rect = boardState.boardEl.getBoundingClientRect();
		item.x = (e.clientX - rect.left - boardState.offsetX) / boardState.scale - this.grabOffsetX;
		item.y = (e.clientY - rect.top - boardState.offsetY) / boardState.scale - this.grabOffsetY;

		if (item.groupId) {
			const group = boardState.groups.find((g) => g.id === item.groupId);
			const partnerIds = group?.itemIds.filter((id) => id !== item.id) ?? [];
			groupActions.joinTargetId = groupActions.boundsContain(partnerIds, item.x, item.y)
				? item.groupId
				: null;
		} else {
			groupActions.joinTargetId = null;
			for (const group of boardState.groups) {
				const gItems = group.itemIds
					.map((id) => boardState.items.find((i) => i.id === id))
					.filter((i): i is EventItem => i !== undefined);
				if (!gItems.length) continue;
				const minX = Math.min(...gItems.map((i) => i.x)) - HALF - PAD;
				const maxX = Math.max(...gItems.map((i) => i.x)) + HALF + PAD;
				const minY = Math.min(...gItems.map((i) => i.y)) - HALF - PAD;
				const maxY = Math.max(...gItems.map((i) => i.y)) + HALF + PAD;
				if (
					item.x >= minX && item.x <= maxX &&
					item.y >= minY && item.y <= maxY &&
					groupActions.canJoin(item, group.id)
				) {
					groupActions.joinTargetId = group.id;
					break;
				}
			}
			groupActions.targetId = groupActions.joinTargetId
				? null
				: (groupActions.findTarget(item.id)?.id ?? null);
		}
	};

	private onDragEnd = () => {
		const item = boardState.items.find((i) => i.id === this.draggingItemId);

		if (item?.groupId) {
			const gid = item.groupId;
			if (groupActions.joinTargetId !== gid) {
				const group = boardState.groups.find((g) => g.id === gid);
				if (group) {
					item.groupId = undefined;
					const remaining = group.itemIds.filter((id) => id !== item.id);
					if (remaining.length <= 1) {
						remaining.forEach((id) => {
							const i = boardState.items.find((i) => i.id === id);
							if (i) i.groupId = undefined;
						});
						connectionStore.removeGroup(gid);
						boardState.groups = boardState.groups.filter((g) => g.id !== gid);
					} else {
						boardState.groups = boardState.groups.map((g) =>
							g.id === gid ? { ...g, itemIds: remaining } : g
						);
						groupActions.layout(gid);
					}
				}
			}
		} else if (groupActions.joinTargetId && item && groupActions.canJoin(item, groupActions.joinTargetId)) {
			const group = boardState.groups.find((g) => g.id === groupActions.joinTargetId);
			if (group && !group.itemIds.includes(item.id)) {
				item.groupId = groupActions.joinTargetId;
				group.itemIds.push(item.id);
				groupActions.layout(groupActions.joinTargetId);
			}
		} else if (groupActions.targetId && this.draggingItemId) {
			const target = boardState.items.find((i) => i.id === groupActions.targetId);
			if (item && target) {
				const gid = crypto.randomUUID();
				item.groupId = gid;
				target.groupId = gid;
				boardState.groups.push({ id: gid, itemIds: [item.id, target.id] });
				groupActions.layout(gid);
			}
		}

		groupActions.targetId = null;
		groupActions.joinTargetId = null;
		this.draggingItemId = null;
		groupActions.frozenPositions = {};
		document.removeEventListener('mousemove', this.onDragMove);
		document.removeEventListener('mouseup', this.onDragEnd);
	};

	async create(e: MouseEvent, type: ItemType) {
		if (!boardState.boardEl) return;
		const rect = boardState.boardEl.getBoundingClientRect();
		const id = crypto.randomUUID();
		boardState.items.push({
			id,
			x: (e.clientX - rect.left - boardState.offsetX) / boardState.scale,
			y: (e.clientY - rect.top - boardState.offsetY) / boardState.scale,
			label: '',
			exists: true,
			type
		});
		await tick();
		document.getElementById(`item-${id}`)?.focus();
	}

	delete(id: string) {
		const item = boardState.items.find((i) => i.id === id);
		if (item?.groupId) {
			const gid = item.groupId;
			boardState.items.forEach((i) => { if (i.groupId === gid) i.groupId = undefined; });
			connectionStore.removeGroup(gid);
			boardState.groups = boardState.groups.filter((g) => g.id !== gid);
		}
		boardState.items = boardState.items.filter((i) => i.id !== id);
		boardState.selectedItemId = null;
	}
}

export const itemActions = new ItemActions();
