<script lang="ts">
	import { onMount } from 'svelte';
	import TransplantDataTable from '$lib/transplantComponents/transplantDataTable.svelte';
	import TransplantDbTargetTable from '$lib/transplantComponents/transplantDbTargetTable.svelte';
	import { schemaService } from '$lib/services/schemaService';
	import { transformedDataService } from '$lib/stores/transformStore';

	// State for drag-and-drop coordination
	let draggedColumn = $state<{ header: string; columnType: string } | null>(null);

	// Add state for schema loading
	let isSchemaLoading = $state(true);
	let schemaError = $state<string | null>(null);
	let hasTransformData = $state(false);

	// Add state for tracking mapped columns
	let mappedColumns = $state<string[]>([]);

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
		const { csvColumn, tableName, fieldName, mappedColumns: newMappedColumns } = event.detail;
		console.log(`Parent: Mapping created: ${csvColumn} -> ${tableName}.${fieldName}`);

		// Update the list of mapped columns
		if (newMappedColumns && Array.isArray(newMappedColumns)) {
			mappedColumns = [...newMappedColumns];
			console.log('Parent: Updated mapped columns from event:', mappedColumns);
		} else if (csvColumn) {
			// If mappedColumns not provided, just add the current column
			if (!mappedColumns.includes(csvColumn)) {
				mappedColumns = [...mappedColumns, csvColumn];
				console.log('Parent: Added column to mapped columns:', csvColumn);
			}
		}
	}

	// Initialize schema service on component mount
	onMount(async () => {
		console.log('TransPlant page: Component mounted');

		// Check if we have transform data
		const transformData = transformedDataService.get() || transformedDataService.getData();
		hasTransformData = !!transformData;

		if (!hasTransformData) {
			console.warn('TransPlant page: No transform data available');
		}

		try {
			// Initialize schema service
			console.log('TransPlant page: Loading schema metadata');
			const schemaData = await schemaService.loadSchemaMetadata();

			if (schemaData) {
				console.log('TransPlant page: Schema metadata loaded successfully');
			} else {
				console.error('TransPlant page: Failed to load schema metadata');
				schemaError = 'Failed to load schema metadata. Please try again.';
			}
		} catch (error) {
			console.error('TransPlant page: Error loading schema metadata:', error);
			schemaError = error.message || 'Unknown error loading schema metadata';
		} finally {
			isSchemaLoading = false;
		}
	});
</script>

<div class="actions">
	<p class="description">
		Drag'n'drop columns to database tables below. Just try! We can fix it later 😎️
	</p>
	<div class="button-container">
		<button class="primary" onclick={() => alert('Save to database functionality coming soon!')}>
			Save to Database
		</button>
		<button onclick={() => (window.location.href = '/transform')}> Back to Transform </button>
	</div>
</div>
<div class="container">
	<h3>Imported Data</h3>

	{#if !hasTransformData}
		<div class="warning-message">
			<p>No transform data available. Please go to the Transform page first.</p>
			<button onclick={() => (window.location.href = '/transform')}> Go to Transform </button>
		</div>
	{:else}
		<TransplantDataTable
			on:dragStart={handleDragStart}
			on:dragEnd={handleDragEnd}
			{mappedColumns}
		/>
		<h3
			style="color: var(--color-purple) ; padding: 0.25rem; border-radius: 0.25rem; margin-top: 1rem; text-align: center;"
		>
			⬇ ⬇ ⬇ ⬇ Drag Columns to Database ⬇ ⬇ ⬇ ⬇
		</h3>

		{#if isSchemaLoading}
			<div class="loading-indicator">
				<p>Loading database schema...</p>
			</div>
		{:else if schemaError}
			<div class="error-message">
				<p>Error: {schemaError}</p>
				<button onclick={() => window.location.reload()}>Retry</button>
			</div>
		{:else}
			<TransplantDbTargetTable {draggedColumn} on:mappingCreated={handleMappingCreated} />
		{/if}
	{/if}
</div>
<div class="persistent-state-container">
	<h3>Persistent Visible State</h3>
	<pre id="persistent-state-display">{JSON.stringify(mappedColumns, null, 2)}</pre>
</div>

<style>
	.persistent-state-container {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 0.25rem;
	}

	.persistent-state-container h3 {
		margin-top: 0;
		color: #495057;
	}

	#persistent-state-display {
		background-color: #212529;
		color: #f8f9fa;
		padding: 1rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		font-family: monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.description {
		/* text-align: left; */
		margin-top: -1rem;
		margin-bottom: 0;
	}

	.actions {
		margin-top: 2rem;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h2 {
		margin-top: -0.5rem;
	}

	.description {
		margin-bottom: 0;
		color: #666;
		font-size: 0.9rem;
	}

	.button-container {
		display: flex;
		gap: 1rem;
	}

	button {
		margin-top: -3em;
		padding: 0.5rem 1rem;
		/* border: 1px solid #ddd; */
		border-radius: 4px;
		background-color: var(--color-purple);
		cursor: pointer;
	}

	/* button:hover {
		background-color: #e5e5e5 5;
	} */

	button.primary {
		background-color: #4caf50;
		color: white;
		border: none;
	}

	button.primary:hover {
		background-color: #3d9140;
	}

	.loading-indicator {
		padding: 1rem;
		background-color: #f0f0f0;
		border-radius: 4px;
		text-align: center;
		margin: 1rem 0;
	}

	.error-message {
		padding: 1rem;
		background-color: #ffebee;
		border: 1px solid #ffcdd2;
		border-radius: 4px;
		color: #c62828;
		margin: 1rem 0;
	}

	.warning-message {
		padding: 1rem;
		background-color: #fff8e1;
		border: 1px solid #ffe082;
		border-radius: 4px;
		color: #ff8f00;
		margin: 1rem 0;
		text-align: center;
	}
</style>
