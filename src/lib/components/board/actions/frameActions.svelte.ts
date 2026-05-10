import { boardState } from '../boardState.svelte.js';
import type { EventItem, FrameItem } from '../types.js';

class FrameActions {
	draggingFrameId = $state<string | null>(null);
	resizingFrameId = $state<string | null>(null);

	private grabOffsetX = 0;
	private grabOffsetY = 0;
	private draggedItemIds: string[] = [];
	private resizeStartW = 0;
	private resizeStartH = 0;
	private resizeStartX = 0;
	private resizeStartY = 0;

	private itemInsideFrame(item: EventItem, frame: FrameItem): boolean {
		return (
			item.x >= frame.x &&
			item.x <= frame.x + frame.width &&
			item.y >= frame.y &&
			item.y <= frame.y + frame.height
		);
	}

	create(e: MouseEvent) {
		if (!boardState.boardEl) return;
		const rect = boardState.boardEl.getBoundingClientRect();
		const id = crypto.randomUUID();
		const wx = (e.clientX - rect.left - boardState.offsetX) / boardState.scale;
		const wy = (e.clientY - rect.top - boardState.offsetY) / boardState.scale;
		boardState.frames.push({ id, x: wx - 175, y: wy - 125, width: 350, height: 250, label: '' });
		boardState.selectedFrameId = id;
	}

	startDrag(e: MouseEvent, frameId: string) {
		const frame = boardState.frames.find((f) => f.id === frameId);
		if (!frame || !boardState.boardEl) return;
		const rect = boardState.boardEl.getBoundingClientRect();
		this.grabOffsetX = (e.clientX - rect.left - boardState.offsetX) / boardState.scale - frame.x;
		this.grabOffsetY = (e.clientY - rect.top - boardState.offsetY) / boardState.scale - frame.y;
		this.draggedItemIds = boardState.items.filter((i) => this.itemInsideFrame(i, frame)).map((i) => i.id);
		this.draggingFrameId = frameId;
		document.addEventListener('mousemove', this.onDragMove);
		document.addEventListener('mouseup', this.onDragEnd);
	}

	private onDragMove = (e: MouseEvent) => {
		const frame = boardState.frames.find((f) => f.id === this.draggingFrameId);
		if (!frame || !boardState.boardEl) return;
		const rect = boardState.boardEl.getBoundingClientRect();
		const newX = (e.clientX - rect.left - boardState.offsetX) / boardState.scale - this.grabOffsetX;
		const newY = (e.clientY - rect.top - boardState.offsetY) / boardState.scale - this.grabOffsetY;
		const dx = newX - frame.x;
		const dy = newY - frame.y;
		frame.x = newX;
		frame.y = newY;
		for (const id of this.draggedItemIds) {
			const item = boardState.items.find((i) => i.id === id);
			if (item) { item.x += dx; item.y += dy; }
		}
	};

	private onDragEnd = () => {
		this.draggingFrameId = null;
		this.draggedItemIds = [];
		document.removeEventListener('mousemove', this.onDragMove);
		document.removeEventListener('mouseup', this.onDragEnd);
	};

	startResize(e: MouseEvent, frameId: string) {
		const frame = boardState.frames.find((f) => f.id === frameId);
		if (!frame) return;
		this.resizeStartW = frame.width;
		this.resizeStartH = frame.height;
		this.resizeStartX = e.clientX;
		this.resizeStartY = e.clientY;
		this.resizingFrameId = frameId;
		document.addEventListener('mousemove', this.onResizeMove);
		document.addEventListener('mouseup', this.onResizeEnd);
	}

	private onResizeMove = (e: MouseEvent) => {
		const frame = boardState.frames.find((f) => f.id === this.resizingFrameId);
		if (!frame) return;
		frame.width = Math.max(150, this.resizeStartW + (e.clientX - this.resizeStartX) / boardState.scale);
		frame.height = Math.max(100, this.resizeStartH + (e.clientY - this.resizeStartY) / boardState.scale);
	};

	private onResizeEnd = () => {
		this.resizingFrameId = null;
		document.removeEventListener('mousemove', this.onResizeMove);
		document.removeEventListener('mouseup', this.onResizeEnd);
	};

	delete(id: string) {
		boardState.frames = boardState.frames.filter((f) => f.id !== id);
		boardState.selectedFrameId = null;
	}
}

export const frameActions = new FrameActions();
