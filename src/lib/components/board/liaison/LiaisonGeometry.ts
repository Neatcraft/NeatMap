import type { EventItem } from '../types.js';

export interface Rect { minX: number; maxX: number; minY: number; maxY: number; }
export interface Dot { x: number; y: number; }

const HALF = 72;
const PAD = 32;

export class LiaisonGeometry {
	static boundsFromItems(items: EventItem[]): Rect | null {
		if (!items.length) return null;
		return {
			minX: Math.min(...items.map((i) => i.x)) - HALF - PAD,
			maxX: Math.max(...items.map((i) => i.x)) + HALF + PAD,
			minY: Math.min(...items.map((i) => i.y)) - HALF - PAD,
			maxY: Math.max(...items.map((i) => i.y)) + HALF + PAD
		};
	}

	static dots(r: Rect): Dot[] {
		const cx = (r.minX + r.maxX) / 2;
		const cy = (r.minY + r.maxY) / 2;
		return [
			{ x: cx, y: r.minY },
			{ x: r.maxX, y: cy },
			{ x: cx, y: r.maxY },
			{ x: r.minX, y: cy }
		];
	}

	static bestEndpoints(from: Dot[], to: Dot[]): { from: Dot; to: Dot } {
		let best = { from: from[0], to: to[0] };
		let minDist = Infinity;
		for (const f of from) {
			for (const t of to) {
				const d = Math.hypot(f.x - t.x, f.y - t.y);
				if (d < minDist) { minDist = d; best = { from: f, to: t }; }
			}
		}
		return best;
	}
}
