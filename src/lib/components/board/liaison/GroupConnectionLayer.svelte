<script lang="ts">
	import type { EventItem } from '../types.js';
	import { LiaisonGeometry } from './LiaisonGeometry.js';
	import { connectionStore } from './connectionStore.svelte.js';

	interface ResolvedGroup { id: string; items: EventItem[]; }
	interface Props { groups: ResolvedGroup[]; }

	let { groups }: Props = $props();

	const dots = $derived.by(() =>
		groups.flatMap((g) => {
			const b = LiaisonGeometry.boundsFromItems(g.items);
			if (!b) return [];
			return LiaisonGeometry.dots(b).map((d, i) => ({
				groupId: g.id,
				x: d.x,
				y: d.y,
				key: `${g.id}-${i}`
			}));
		})
	);

	const lines = $derived.by(() =>
		connectionStore.connections
			.map((conn) => {
				const fromG = groups.find((g) => g.id === conn.from);
				const toG = groups.find((g) => g.id === conn.to);
				if (!fromG || !toG) return null;
				const fromB = LiaisonGeometry.boundsFromItems(fromG.items);
				const toB = LiaisonGeometry.boundsFromItems(toG.items);
				if (!fromB || !toB) return null;
				const { from, to } = LiaisonGeometry.bestEndpoints(
					LiaisonGeometry.dots(fromB),
					LiaisonGeometry.dots(toB)
				);
				const dx = to.x - from.x;
				const cx1 = from.x + dx * 0.5;
				const cy1 = from.y;
				const cx2 = to.x - dx * 0.5;
				const cy2 = to.y;
				const angle = Math.atan2(to.y - from.y, to.x - from.x);
				const S = 10;
				return {
					id: conn.id,
					path: `M ${from.x} ${from.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${to.x - S * 0.8 * Math.cos(angle)} ${to.y - S * 0.8 * Math.sin(angle)}`,
					arrow: [
						`M ${to.x - S * Math.cos(angle - Math.PI / 6)} ${to.y - S * Math.sin(angle - Math.PI / 6)}`,
						`L ${to.x} ${to.y}`,
						`L ${to.x - S * Math.cos(angle + Math.PI / 6)} ${to.y - S * Math.sin(angle + Math.PI / 6)}`
					].join(' ')
				};
			})
			.filter((d): d is NonNullable<typeof d> => d !== null)
	);

	function onDotDown(e: MouseEvent, groupId: string, x: number, y: number) {
		e.stopPropagation();
		if (!connectionStore.connectingFrom) {
			connectionStore.startFrom(groupId, x, y);
		} else {
			connectionStore.connectTo(groupId);
		}
	}
</script>

<svg
	class="pointer-events-none absolute inset-0 overflow-visible"
	width="100%"
	height="100%"
	style="z-index:20;"
>
	{#each lines as l (l.id)}
		<path d={l.path} stroke="#475569" stroke-width="1.5" fill="none" />
		<path d={l.arrow} stroke="#475569" stroke-width="1.5" fill="#475569" stroke-linejoin="round" />
	{/each}
	{#if connectionStore.connectingFrom}
		<line
			x1={connectionStore.connectingFrom.x}
			y1={connectionStore.connectingFrom.y}
			x2={connectionStore.mouseX}
			y2={connectionStore.mouseY}
			stroke="#3b82f6"
			stroke-width="1.5"
			stroke-dasharray="6,4"
		/>
	{/if}
	{#each dots as dot (dot.key)}
		<circle
			cx={dot.x}
			cy={dot.y}
			r="7"
			fill={connectionStore.connectingFrom ? '#3b82f6' : '#64748b'}
			stroke="white"
			stroke-width="2"
			style="cursor:crosshair;pointer-events:auto;"
			onmousedown={(e) => onDotDown(e, dot.groupId, dot.x, dot.y)}
		/>
	{/each}
</svg>
