import { boardState } from '../boardState.svelte.js';

const KEYBOARD_STEP = 20;

class NavActions {
	isPanning = $state(false);
	isLeftDown = $state(false);
	startX = 0;
	startY = 0;
	private lastX = 0;
	private lastY = 0;

	startPan(e: MouseEvent) {
		this.isPanning = true;
		this.lastX = e.clientX;
		this.lastY = e.clientY;
	}

	pan(e: MouseEvent) {
		if (!this.isPanning) return;
		boardState.offsetX += e.clientX - this.lastX;
		boardState.offsetY += e.clientY - this.lastY;
		this.lastX = e.clientX;
		this.lastY = e.clientY;
	}

	endPan() {
		this.isPanning = false;
	}

	startClick(e: MouseEvent) {
		this.isLeftDown = true;
		this.startX = e.clientX;
		this.startY = e.clientY;
	}

	endClick() {
		this.isLeftDown = false;
	}

	zoom(e: WheelEvent) {
		e.preventDefault();
		const rect = boardState.boardEl!.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
		const newScale = Math.max(0.1, Math.min(5, boardState.scale * factor));
		boardState.offsetX = mouseX - (mouseX - boardState.offsetX) * (newScale / boardState.scale);
		boardState.offsetY = mouseY - (mouseY - boardState.offsetY) * (newScale / boardState.scale);
		boardState.scale = newScale;
	}

	keyboard(e: KeyboardEvent) {
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [KEYBOARD_STEP, 0],
			ArrowRight: [-KEYBOARD_STEP, 0],
			ArrowUp: [0, KEYBOARD_STEP],
			ArrowDown: [0, -KEYBOARD_STEP]
		};
		const move = moves[e.key];
		if (!move) return;
		e.preventDefault();
		boardState.offsetX += move[0];
		boardState.offsetY += move[1];
	}

	reset() {
		this.isPanning = false;
		this.isLeftDown = false;
	}
}

export const navActions = new NavActions();
