export type ItemType = 'event' | 'command' | 'actor' | 'system' | 'data' | 'policy' | 'hot-spot';

export interface EventItem {
	id: string;
	x: number;
	y: number;
	label: string;
	exists: boolean;
	type: ItemType;
	groupId?: string;
}

export interface Group {
	id: string;
	itemIds: string[];
}

export type BoardAction = 'add-event-item' | 'manage-commands' | 'add-actor' | 'add-system' | 'add-data' | 'add-policy' | 'add-hot-spot' | 'add-frame' | null;

export interface FrameItem {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	label: string;
}