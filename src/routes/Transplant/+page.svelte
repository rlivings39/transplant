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

<div class="container">
	<h1>Transplant Data</h1>
	<p class="description">
		Drag'n drop columns to tree planting database below. Just try we can fix it later 😎️
	</p>

	{#if !hasTransformData}
		<div class="warning-message">
			<p>No transform data available. Please go to the Transform page first.</p>
			<button onclick={() => (window.location.href = '/transform')}> Go to Transform </button>
		</div>
	{:else}
		<TransplantDataTable on:dragStart={handleDragStart} on:dragEnd={handleDragEnd} />
		<br />
		<h2>Database Tables</h2>

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

		<div class="actions">
			<button class="primary" onclick={() => alert('Save to database functionality coming soon!')}>
				Save to Database
			</button>
			<button onclick={() => (window.location.href = '/transform')}> Back to Transform </button>
		</div>
	{/if}
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
