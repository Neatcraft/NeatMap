<script lang="ts">
	import type { FrameItem } from './types.js';

	interface Props {
		frame: FrameItem;
		isSelected: boolean;
		isDragging: boolean;
		interactive: boolean;
		onDragStart: (e: MouseEvent) => void;
		onResizeStart: (e: MouseEvent) => void;
		onSelect: () => void;
		onDelete: () => void;
	}

	let { frame, isSelected, isDragging, interactive, onDragStart, onResizeStart, onSelect, onDelete }: Props =
		$props();
</script>

<article
	class="absolute rounded-lg"
	class:pointer-events-auto={interactive}
	class:pointer-events-none={!interactive}
	style="
		left: {frame.x}px;
		top: {frame.y}px;
		width: {frame.width}px;
		height: {frame.height}px;
		background: rgba(241,245,249,0.75);
		border: 2px dashed {isSelected ? '#475569' : '#94A3B8'};
	"
>
	<!-- Drag surface — inset-0, lowest layer -->
	<button
		class="absolute inset-0 rounded-lg"
		class:cursor-grab={!isDragging}
		class:cursor-grabbing={isDragging}
		aria-label="Move bounded context"
		onmousedown={(e) => { onSelect(); onDragStart(e); }}
	></button>

	<!-- Editable label — z-10 -->
	<div
		class="relative z-10 px-3 pt-2 font-barlow text-xs font-bold uppercase tracking-tight text-slate-500 outline-none empty:before:text-slate-400 empty:before:content-['Bounded_Context']"
		contenteditable="true"
		role="textbox"
		tabindex="0"
		aria-label="Frame label"
		aria-multiline="false"
		bind:textContent={frame.label}
	></div>

	<!-- Delete button — z-20, top-right, visible on hover -->
	<div class="absolute right-2 top-2 z-20">
		<button
			class="delete-btn flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-slate-400"
			aria-label="Delete bounded context"
			onclick={onDelete}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true">
				<path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.769l-1.005-13.07-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" />
			</svg>
		</button>
	</div>

	<!-- Resize handle — z-20, bottom-right -->
	<button
		class="absolute bottom-1 right-1 z-20 h-3 w-3 cursor-se-resize rounded-sm bg-slate-400 opacity-0 transition-opacity duration-150"
		aria-label="Resize bounded context"
		onmousedown={onResizeStart}
	></button>
</article>

<style>
	.delete-btn {
		opacity: 0;
		transition: opacity 150ms, transform 150ms;
	}

	article:hover .delete-btn {
		opacity: 1;
	}

	article:hover button[aria-label="Resize bounded context"] {
		opacity: 1;
	}

	.delete-btn:hover {
		transform: scale(1.1);
	}
</style>