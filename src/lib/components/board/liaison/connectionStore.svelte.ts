interface Connection { id: string; from: string; to: string; }

class ConnectionStore {
	connectingFrom = $state<{ groupId: string; x: number; y: number } | null>(null);
	mouseX = $state(0);
	mouseY = $state(0);
	connections = $state<Connection[]>([]);

	startFrom(groupId: string, x: number, y: number) {
		this.connectingFrom = { groupId, x, y };
		this.mouseX = x;
		this.mouseY = y;
	}

	updateMouse(x: number, y: number) {
		this.mouseX = x;
		this.mouseY = y;
	}

	connectTo(groupId: string) {
		if (!this.connectingFrom || this.connectingFrom.groupId === groupId) {
			this.cancel();
			return;
		}
		const from = this.connectingFrom.groupId;
		const exists = this.connections.some(
			(c) => (c.from === from && c.to === groupId) || (c.from === groupId && c.to === from)
		);
		if (!exists) this.connections.push({ id: crypto.randomUUID(), from, to: groupId });
		this.cancel();
	}

	cancel() {
		this.connectingFrom = null;
	}

	removeGroup(groupId: string) {
		this.connections = this.connections.filter((c) => c.from !== groupId && c.to !== groupId);
	}
}

export const connectionStore = new ConnectionStore();
