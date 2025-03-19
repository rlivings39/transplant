<script lang="ts">
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
</script>

<TransferDataTable columnRep={columns} columnTypes={data} toggledColumns={toggledColumns} {invalidCells} />

<!-- <script lang="ts">
	import TransformColumnModel from '$lib/transformComponents/transformColumnModel.svelte';
  
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
  
	// Function to handle CSV data loaded event
	function handleCsvLoaded() {
	  console.log('CSV data loaded event received');
	  if (transformManagerComponent) {
		transformManagerComponent.initializeColumns();
	  }
	}
  </script> -->

<!-- class="transform-container">

	<TransformColumnModel
		on:dataTransformed={handleTransformedData}
		on:csvLoaded={handleCsvLoaded}
		bind:this={transformManagerComponent}
	/>
</div>  -->
