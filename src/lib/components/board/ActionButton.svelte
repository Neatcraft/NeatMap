<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		color: string;
		iconColor: string;
		isActive?: boolean;
		onclick?: () => void;
		icon: Snippet;
	}

	let { label, color, iconColor, isActive = false, onclick, icon }: Props = $props();
</script>

<button
	class="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150 hover:scale-[1.08] hover:shadow-sm active:scale-95"
	style="background-color: {color}; {isActive ? `box-shadow: 0 0 0 4px #ED7D1A;` : ''}"
	aria-label={label}
	aria-pressed={isActive}
	{onclick}
>
	<span style="color: {iconColor};" aria-hidden="true">
		{@render icon()}
	</span>
</button>