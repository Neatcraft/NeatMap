<script lang="ts">
	import type { EventItem } from '../../types.js';

	interface Props {
		items: EventItem[];
		isDragging: boolean;
		isJoinTarget: boolean;
		onDragStart: (e: MouseEvent) => void;
	}

	let { items, isDragging, isJoinTarget, onDragStart }: Props = $props();

	const HALF = 72;
	const PAD = 32;

	const minX = $derived(Math.min(...items.map((i) => i.x)) - HALF - PAD);
	const minY = $derived(Math.min(...items.map((i) => i.y)) - HALF - PAD);
	const maxX = $derived(Math.max(...items.map((i) => i.x)) + HALF + PAD);
	const maxY = $derived(Math.max(...items.map((i) => i.y)) + HALF + PAD);
</script>

<div
	class="pointer-events-auto absolute rounded-3xl"
	class:cursor-grab={!isDragging}
	class:cursor-grabbing={isDragging}
	style="
		left: {minX}px;
		top: {minY}px;
		width: {maxX - minX}px;
		height: {maxY - minY}px;
		background: rgba(226, 232, 240, 0.72);
		border: {isJoinTarget ? '2px solid #002740' : '1.5px solid rgba(203, 213, 225, 0.9)'};
		box-shadow: {isJoinTarget
			? '0 0 0 4px rgba(0,39,64,0.15), 0 4px 24px rgba(0,39,64,0.09)'
			: '0 4px 24px rgba(0,39,64,0.09), inset 0 1px 0 rgba(255,255,255,0.7)'};
	"
	onmousedown={onDragStart}
></div>
