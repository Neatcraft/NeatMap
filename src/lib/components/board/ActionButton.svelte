<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		color: string;
		iconColor: string;
		isActive?: boolean;
		tooltip?: string;
		onclick?: () => void;
		icon: Snippet;
	}

	let { label, color, iconColor, isActive = false, tooltip, onclick, icon }: Props = $props();
</script>

<div class="group relative">
	<button
		class="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150 hover:scale-[1.08] hover:shadow-sm active:scale-95"
		style="background-color: {color}; {isActive ? `box-shadow: 0 0 0 4px ${iconColor};` : ''}"
		aria-label={label}
		aria-pressed={isActive}
		{onclick}
	>
		<span style="color: {iconColor};" aria-hidden="true">
			{@render icon()}
		</span>
	</button>

	{#if tooltip}
		<span
			role="tooltip"
			class="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#002740] px-2 py-1 font-montserrat text-xs text-white invisible group-hover:visible"
		>
			{tooltip}
		</span>
	{/if}
</div>