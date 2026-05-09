<script lang="ts">
	import type { EventItem } from '../../types.js';

	interface Props {
		item: EventItem;
		isDragging: boolean;
		isSelected: boolean;
		bg: string;
		existsColor: string;
		newColor: string;
		placeholder: string;
		cardLabel: string;
		showExistsToggle?: boolean;
		alertIndicator?: boolean;
		onDragStart: (e: MouseEvent) => void;
		onSelect: () => void;
		onDelete: () => void;
	}

	let {
		item,
		isDragging,
		isSelected,
		bg,
		existsColor,
		newColor,
		placeholder,
		cardLabel,
		showExistsToggle = true,
		alertIndicator = false,
		onDragStart,
		onSelect,
		onDelete
	}: Props = $props();
</script>

<article
	class="pointer-events-auto absolute size-36 -translate-x-1/2 -translate-y-1/2 select-none rounded-none border-l-4 flex items-center justify-center p-3"
	class:z-10={isSelected}
	style="left: {item.x}px; top: {item.y}px; background-color: {bg}; border-left-color: {item.exists ? existsColor : newColor}; box-shadow: 0 20px 25px -5px rgba(0,39,64,0.07), 0 8px 10px -6px rgba(0,39,64,0.05);"
	style:outline={isSelected ? `2px solid ${existsColor}` : null}
>
	<button
		class="group absolute inset-0 rounded-none"
		class:cursor-grab={!isDragging}
		class:cursor-grabbing={isDragging}
		aria-label="Move item"
		aria-describedby="type-tooltip-{item.id}"
		onmousedown={(e) => { onSelect(); onDragStart(e); }}
	>
		<span
			id="type-tooltip-{item.id}"
			role="tooltip"
			class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-none bg-[#002740] px-2 py-1 font-montserrat text-xs text-white invisible group-hover:visible"
		>
			{cardLabel}
		</span>
	</button>

	{#if alertIndicator}
		<div class="absolute left-2 top-2 z-20 flex h-5 w-5 items-center justify-center font-barlow text-sm font-bold" style="color: {existsColor};">
			!
		</div>
	{/if}

	{#if showExistsToggle}
		<div class="group absolute right-2 top-2 z-20">
			<input type="checkbox" id="exists-{item.id}" class="sr-only" aria-label="Already exists" aria-describedby="tooltip-{item.id}" bind:checked={item.exists} />
			<label for="exists-{item.id}" class="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 hover:scale-110" style="color: {item.exists ? existsColor : newColor};">
				{#if item.exists}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true">
						<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75S21.75 6.615 21.75 12s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true">
						<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm0 1.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z" clip-rule="evenodd" />
					</svg>
				{/if}
			</label>
			<span id="tooltip-{item.id}" role="tooltip" class="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-none bg-[#002740] px-2 py-1 font-montserrat text-xs text-white invisible group-hover:visible">
				Already exists
			</span>
		</div>
	{/if}

	<div class="absolute bottom-2 right-2 z-20">
		<button class="delete-btn flex h-5 w-5 cursor-pointer items-center justify-center rounded-full" style="color: {existsColor};" aria-label="Delete item" onclick={onDelete}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true">
				<path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.769l-1.005-13.07-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" />
			</svg>
		</button>
	</div>

	<div
		id="item-{item.id}"
		class="placeholder relative z-10 w-full cursor-text text-center font-barlow text-base font-bold uppercase tracking-tight text-black outline-none"
		data-placeholder={placeholder}
		contenteditable="true"
		role="textbox"
		onfocus={onSelect}
		tabindex="0"
		aria-label="Item label"
		aria-multiline="true"
		bind:textContent={item.label}
	></div>
</article>

<style>
	.placeholder:empty::before {
		content: attr(data-placeholder);
		color: rgba(0, 0, 0, 0.3);
	}

	.delete-btn {
		opacity: 0;
		transition: opacity 150ms, transform 150ms;
	}

	article:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		transform: scale(1.1);
	}
</style>