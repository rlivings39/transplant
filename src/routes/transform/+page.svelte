<script lang="ts">
	import TransformManager from '$lib/transformComponents/TransformManager.svelte';
	import { goto } from '$app/navigation';
	import { transformedDataService } from '$lib/stores/transformStore';

	// Interface for validated transform data
	interface ValidatedTransformData {
		records: Array<{
			[key: string]: string | number | null;
		}>;
		columnTypes: {
			[key: string]: 'string' | 'number' | 'date' | 'gps' | 'latitude' | 'longitude';
		};
	}

	// Local state using runes
	let transformedRecords = $state([]);
	let columnTypeMap = $state({});
	let toggledColumnsState = $state({});
	let csvDataLoaded = $state(false);
	let dataTransformed = $state(false);

	// Reference to the TransformManager component
	let transformManagerComponent;

	// Function to receive data from TransformManager component
	function handleTransformedData(event) {
		// Get the data from the event
		const { records, columnTypes, toggledColumns } = event.detail;

		console.log('handleTransformedData called with records:', records?.length || 0);
		console.log('Column types received:', Object.keys(columnTypes || {}).length);
		console.log('Toggled columns received:', toggledColumns);

		// Update local state
		transformedRecords = records;
		columnTypeMap = columnTypes;
		toggledColumnsState = toggledColumns || {};
		dataTransformed = true;

		console.log('Local state updated. transformedRecords length:', transformedRecords.length);
	}

	// Function to handle CSV data loaded event
	function handleCsvLoaded() {
		console.log('CSV data loaded event received');
		csvDataLoaded = true;
	}

	// Function to send data to TransPlant
	function sendToTransplant() {
		console.log('sendToTransplant called');

		if (!transformManagerComponent) {
			console.error('TransformManager component not found');
			alert('Error: Could not access the TransformManager component');
			return;
		}

		// Get the transformed data from the component
		const exportData = transformManagerComponent.exportToTransplant();

		if (!exportData || !exportData.records || exportData.records.length === 0) {
			console.error('No data available to export');
			alert('No data available. Please transform data first.');
			return;
		}

		console.log('Exporting data to TransPlant:', exportData);

		// Store in the service for TransPlant to access
		transformedDataService.set(exportData);

		// Navigate to the TransPlant page
		goto('/transplant');
	}
</script>

<div class="transform-container">
	<div class="transform-header">
		<h1>Transform Data</h1>
		{#if csvDataLoaded}
			<button onclick={sendToTransplant}> Send to TransPlant </button>
		{/if}
	</div>
	<TransformManager
		on:dataTransformed={handleTransformedData}
		on:csvLoaded={handleCsvLoaded}
		bind:this={transformManagerComponent}
	/>
</div>
