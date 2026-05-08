export type ItemType = 'event' | 'command' | 'actor' | 'system' | 'data';

export interface EventItem {
	id: string;
	x: number;
	y: number;
	label: string;
	exists: boolean;
	type: ItemType;
}

export type BoardAction = 'add-event-item' | 'manage-commands' | 'add-actor' | 'add-system' | 'add-data' | null;