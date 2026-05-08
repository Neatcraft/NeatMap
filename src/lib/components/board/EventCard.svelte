<script lang="ts">
	import type { EventItem } from './types.js';

	interface Props {
		item: EventItem;
		isDragging: boolean;
		onDragStart: (e: MouseEvent) => void;
	}

	let { item, isDragging, onDragStart }: Props = $props();

	const THEME = {
		event:   { bg: '#FFDCC6', existsColor: '#C44500', newColor: '#16A34A' },
		command: { bg: '#DBEAFE', existsColor: '#2663EB', newColor: '#16A34A' }
	} as const;

	const theme = $derived(THEME[item.type]);
	const EXISTS_COLOR = $derived(theme.existsColor);
	const NEW_COLOR = $derived(theme.newColor);
</script>

<article
	class="pointer-events-auto absolute size-36 -translate-x-1/2 -translate-y-1/2 select-none rounded-none border-l-4 flex items-center justify-center p-3"
	style="left: {item.x}px; top: {item.y}px; background-color: {theme.bg}; border-left-color: {item.exists ? EXISTS_COLOR : NEW_COLOR}; box-shadow: 0 20px 25px -5px rgba(0,39,64,0.07), 0 8px 10px -6px rgba(0,39,64,0.05);"
>
	<!-- Drag surface — lowest z, spans whole card -->
	<button
		class="group absolute inset-0 rounded-none"
		class:cursor-grab={!isDragging}
		class:cursor-grabbing={isDragging}
		aria-label="Move item"
		aria-describedby="type-tooltip-{item.id}"
		onmousedown={onDragStart}
	>
		<span
			id="type-tooltip-{item.id}"
			role="tooltip"
			class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-none bg-[#002740] px-2 py-1 font-montserrat text-xs text-white invisible group-hover:visible"
		>
			Event
		</span>
	</button>

	<!-- Exists toggle — z-20 routes clicks here via CSS stacking, no stopPropagation needed -->
	<div class="group absolute right-2 top-2 z-20">
		<input
			type="checkbox"
			id="exists-{item.id}"
			class="sr-only"
			aria-label="Already exists"
			aria-describedby="tooltip-{item.id}"
			bind:checked={item.exists}
		/>
		<label
			for="exists-{item.id}"
			class="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 hover:scale-110"
			style="color: {item.exists ? EXISTS_COLOR : NEW_COLOR};"
		>
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
		<span
			id="tooltip-{item.id}"
			role="tooltip"
			class="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-none bg-[#002740] px-2 py-1 font-montserrat text-xs text-white invisible group-hover:visible"
		>
			Already exists
		</span>
	</div>

	<!-- Editable text — z-10, above drag button; z-index stacking routes clicks here, no stopPropagation needed -->
	<div
		id="item-{item.id}"
		class="relative z-10 w-full cursor-text text-center font-montserrat text-sm font-medium text-black outline-none empty:before:text-black/30 empty:before:content-['Domain_Event']"
		contenteditable="true"
		role="textbox"
		tabindex="0"
		aria-label="Event item label"
		aria-multiline="true"
		bind:textContent={item.label}
	></div>
</article>
