<script lang="ts">
	let offsetX = $state(0);
	let offsetY = $state(0);
	let isPanning = $state(false);
	let lastX = 0;
	let lastY = 0;

	function onMouseDown(e: MouseEvent) {
		isPanning = true;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function onMouseMove(e: MouseEvent) {
		if (!isPanning) return;
		offsetX += e.clientX - lastX;
		offsetY += e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function onMouseUp() {
		isPanning = false;
	}
</script>

<div
	class="h-full w-full overflow-hidden select-none"
	style="background-color: #f7f7f7; background-image: radial-gradient(circle, #c4c4c4 1px, transparent 1px); background-size: 32px 32px; background-position: {offsetX}px {offsetY}px; cursor: {isPanning ? 'grabbing' : 'grab'};"
	role="application"
	aria-label="Whiteboard canvas"
	onmousedown={onMouseDown}
	onmousemove={onMouseMove}
	onmouseup={onMouseUp}
	onmouseleave={onMouseUp}
></div>