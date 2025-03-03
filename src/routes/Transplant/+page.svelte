<script lang="ts">
	import { onMount } from 'svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { goto } from '$app/navigation';

	// Define the ValidatedTransformData interface
	interface ValidatedTransformData {
		records: Array<{
			[key: string]: string | number | null;
		}>;
		columnTypes: {
			[key: string]: 'string' | 'number' | 'date' | 'gps' | 'latitude' | 'longitude';
		};
	}

	// Local state using runes
	let localData = $state<ValidatedTransformData | null>(null);
	let dataSource = $state('none');
	let debug = $state('Waiting for data...');

	// Function to return to transform page
	function returnToTransform() {
		// Clear data and navigate back
		transformedDataService.clear();
		goto('/transform');
	}

	// Single onMount function to load and validate data
	
	onMount(() => {
		// // console.log('Transplant page mounted, checking for data');

		// Try both methods to get data from service
		let rawData = transformedDataService.get();

		// If get() didn't work, try getData()
		if (!rawData) {
			// // console.log('get() returned null, trying getData()');
			rawData = transformedDataService.getData();
		}

		// // console.log('Raw data received:', rawData);

		if (rawData && rawData.records && rawData.records.length > 0) {
			// // console.log('Raw data records:', rawData.records.length);
			// // console.log('Raw data column types:', rawData.columnTypes);

			try {
				// Make a clean copy of the data to avoid Svelte 5 proxy issues
				const cleanData = {
					records: JSON.parse(JSON.stringify(rawData.records)),
					columnTypes: JSON.parse(JSON.stringify(rawData.columnTypes))
				};

				// // console.log('Clean data created:', cleanData);

				// Validate the data structure
				const isValidStructure = validateDataStructure(cleanData);

				if (isValidStructure) {
					localData = cleanData;
					dataSource = 'store';
					// // console.log('Valid data found:', localData);
					debug = 'Data successfully loaded from Transform stage';
				} else {
					// console.error('Data structure validation failed');
					debug = 'Error: Invalid data structure received from Transform stage';
				}
			} catch (error) {
				// console.error('Error processing data:', error);
				debug = 'Error processing data: ' + error.message;
			}
		} else {
			// // console.log('No data found');
			debug = 'No data found. Please go to transform page first.';
		}
	});

	// Function to validate the data structure
	function validateDataStructure(data: any): boolean {
		// // console.log('Validating data structure');

		// Check if data has the required properties
		if (!data || !data.records || !data.columnTypes) {
			// console.error('Missing required properties in data');
			return false;
		}

		// Check if records is an array
		if (!Array.isArray(data.records)) {
			// console.error('Records is not an array');
			return false;
		}

		// Check if we have any records
		if (data.records.length === 0) {
			// console.error('No records found');
			return false;
		}

		// Check if columnTypes is an object
		if (typeof data.columnTypes !== 'object' || data.columnTypes === null) {
			// console.error('ColumnTypes is not an object');
			return false;
		}

		// Skip detailed type validation - just make sure the basic structure is correct
		// // console.log('Data structure validation passed');
		return true;
	}
</script>

<div class="container">
	<h1>Transplant Data</h1>

	<!-- <div class="debug-info">
		<h3>Debug Information</h3>
		<p><strong>Data source:</strong> {dataSource}</p>
		<p><strong>Debug status:</strong> {debug}</p>
		<p><strong>Data available:</strong> {localData ? 'Yes' : 'No'}</p>
		{#if localData}
			<p><strong>Records:</strong> {localData.records?.length || 0}</p>
			<p><strong>Column types:</strong> {Object.keys(localData.columnTypes || {}).length}</p>
		{/if}
	</div> -->

	{#if localData && localData.records && localData.records.length > 0}
		<table>
			<thead>
				<tr>
					{#each Object.keys(localData.records[0]) as header}
						<th>{header} ({localData.columnTypes[header]})</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each localData.records as record}
					<tr>
						{#each Object.keys(record) as key}
							<td>{record[key]}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- <div class="data-summary">
			<h3>Data Summary</h3>
			<p>Total records: {localData.records.length}</p>
			<p>Columns: {Object.keys(localData.columnTypes).join(', ')}</p>
		</div> -->
	{/if}
</div>
