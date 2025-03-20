<script lang="ts">
	import TransferDataTable from '$lib/transferComponents/transferDataTable.svelte';
	import TransferCsvImporter from '$lib/transformComponents/transferCSVImporter.svelte';
	import TransformColumnModel from '$lib/transformComponents/transformColumnModel.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	// Define the TransformEvent interface
	interface TransformEvent {
		detail: {
			records: Array<Record<string, string | number | null>>;
			columnTypes: Record<string, string>;
		};
	}

	// Local state using runes
	let transformedRecords = $state<Array<Record<string, string | number | null>>>([]);
	let columnTypeMap = $state<Record<string, string>>({});
	let transformManagerComponent = $state<TransformColumnModel | null>(null);

	// Function to receive data from TransformManager component
	function handleTransformedData(event: TransformEvent) {
		const { records, columnTypes } = event.detail;

		// Update local state
		transformedRecords = records;
		columnTypeMap = columnTypes;

		// Process records
		records.forEach((record: Record<string, string | number | null>) => {
			// Process each record
		});
	}

	let columnRep = $state<ColumnRep[]>([]);
	let errorMessage = $state<string | null>(null);


	function handleProcessedData(assignColumnRepVar: ColumnRep[]) {
		columnRep = assignColumnRepVar;
		// console.log('ColumnRep received:', columnRep);
	}

	function handleError(handleErrorVar: string) {
		errorMessage = handleErrorVar;
		console.error(handleErrorVar);
	}

	// Function to handle CSV data loaded event
	function handleCsvLoaded() {
		console.log('CSV data loaded event received');
		if (transformManagerComponent) {
			transformManagerComponent.initializeColumns();
		}
	}
</script>

<div class="transform-container">
	<TransformColumnModel
		on:dataTransformed={handleTransformedData}
		on:csvLoaded={handleCsvLoaded}
		bind:this={transformManagerComponent}
	/>
</div>


<div class="transfer-page">
	<h1>Data Transfer</h1>

	<TransferCsvImporter onProcessedData={handleProcessedData} onError={handleError} />
	{#if errorMessage}
		<div class="error-banner">{errorMessage}</div>
	{:else if columnRep.length > 0}
		<TransferDataTable {columnRep} {columnTypes} {toggledColumns} {invalidCells} />
	{/if}
</div>



<!-- <csvImporter  /> -->
<!-- <TransferDataTable columnRep={columns} columnTypes={data} {toggledColumns} {invalidCells} /> -->

<!-- <div class="transform-container">
	<div class="transform-header">
		<h1>Transform Data</h1>
		{#if csvDataLoaded}
			<button onclick={sendToTransplant}> Send to TransPlant </button>
		{/if} -->
<!-- </div>
	<TransformManager
		on:dataTransformed={handleTransformedData}
		on:csvLoaded={handleCsvLoaded}
		bind:this={transformManagerComponent}
	/>
</div> -->
<!-- <script lang="ts">
	import TransferDataTable from '$lib/transferComponents/transferDataTable.svelte';

	// Sample data to test the table
	const columns = [
		{ headerName: 'Name', values: [1, 2] },
		{ headerName: 'Age', values: [30, 25] },
		{ headerName: 'City', values: ['New York', 'Los Angeles'] }
	];

	const test = columns[1]["headerName"];

	const data = [
		{ Name: 'Alice', Age: 30, City: 'New York' },
		{ Name: 'Bob', Age: 25, City: 'Los Angeles' }
	];
	const toggledColumns = { Name: false, Age: false, City: false };

	const invalidCells = { Name: [], Age: [], City: [] };
</script> -->
