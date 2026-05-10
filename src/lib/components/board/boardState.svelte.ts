import type { BoardAction, EventItem, FrameItem, Group } from './types.js';

class BoardState {
	items = $state<EventItem[]>([]);
	frames = $state<FrameItem[]>([]);
	groups = $state<Group[]>([]);
	offsetX = $state(0);
	offsetY = $state(0);
	scale = $state(1);
	selectedItemId = $state<string | null>(null);
	selectedFrameId = $state<string | null>(null);
	activeAction = $state<BoardAction>(null);
	boardEl = $state<HTMLElement | null>(null);
}

export const boardState = new BoardState();
