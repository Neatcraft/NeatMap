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
	bg="#DCFCE7" existsColor="#15803D" newColor="#16A34A"
	placeholder="Data" cardLabel="Data"
/>