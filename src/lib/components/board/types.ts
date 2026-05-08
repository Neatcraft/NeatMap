export interface EventItem {
	id: string;
	x: number;
	y: number;
	label: string;
	exists: boolean;
}

export type BoardAction = 'add-event-item' | 'manage-commands' | null;