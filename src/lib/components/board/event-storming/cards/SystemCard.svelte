<script lang="ts">
	import Card from './Card.svelte';
	import type { EventItem } from '../../types.js';

	interface Props {
		item: EventItem;
		isDragging: boolean;
		isSelected: boolean;
		onDragStart: (e: MouseEvent) => void;
		onSelect: () => void;
		onDelete: () => void;
	}

	let { item, isDragging, isSelected, onDragStart, onSelect, onDelete }: Props = $props();
</script>

<Card
	{item} {isDragging} {isSelected} {onDragStart} {onSelect} {onDelete}
	bg="#FCE7F3" existsColor="#BE185D" newColor="#16A34A"
	placeholder="System" cardLabel="System"
/>