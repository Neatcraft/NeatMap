export type ItemType = 'event' | 'command';

export interface EventItem {
	id: string;
	x: number;
	y: number;
	label: string;
	exists: boolean;
	type: ItemType;
}

export type BoardAction = 'add-event-item' | 'manage-commands' | null;