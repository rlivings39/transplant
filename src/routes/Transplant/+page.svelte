<script lang="ts">
	import TransplantDataTable from '$lib/transplantComponents/transplantDataTable.svelte';
	import TransplantDbTargetTable from '$lib/transplantComponents/transplantDbTargetTable.svelte';

	// State for drag-and-drop coordination
	let draggedColumn = $state<{ header: string; columnType: string } | null>(null);

	// Handle drag start from the data table
	function handleDragStart(event: CustomEvent) {
		const { header, columnType } = event.detail;
		draggedColumn = { header, columnType };
		console.log(`Parent: Drag started for ${header} of type ${columnType}`);
	}

	// Handle drag end
	function handleDragEnd() {
		draggedColumn = null;
		console.log('Parent: Drag ended');
	}

	// Handle successful mapping
	function handleMappingCreated(event: CustomEvent) {
		const { csvColumn, tableName, fieldName } = event.detail;
		console.log(`Parent: Mapping created: ${csvColumn} -> ${tableName}.${fieldName}`);
	}
</script>

<div class="container">
	<h1>Transplant Data</h1>
	<p class="description">
		Drag columns from transplant table to the database tables. Column types must be
		compatible with the target field types.
	</p>

	<TransplantDataTable on:dragStart={handleDragStart} on:dragEnd={handleDragEnd} />
	<br>
	<h2>Database Tables</h2>
	<TransplantDbTargetTable {draggedColumn} on:mappingCreated={handleMappingCreated} />

	<div class="actions">
		<button class="primary" onclick={() => alert('Save to database functionality coming soon!')}>
			Save to Database
		</button>
		<button onclick={() => (window.location.href = '/transform')}> Back to Transform </button>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	h2 {
		margin-top: 2rem;
		margin-bottom: 0.5rem;
	}

	.description {
		margin-bottom: 1rem;
		color: #666;
		font-size: 0.9rem;
	}

	.actions {
		margin-top: 2rem;
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background-color: #f5f5f5;
		cursor: pointer;
	}

	button:hover {
		background-color: #e5e5e5;
	}

	button.primary {
		background-color: #4caf50;
		color: white;
		border: none;
	}

	button.primary:hover {
		background-color: #3d9140;
	}
</style>
