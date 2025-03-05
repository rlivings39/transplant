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
	let totalRecords = $state(0); // Track total number of records

	// Function to return to transform page
	function returnToTransform() {
		// Clear data and navigate back
		transformedDataService.clear();
		goto('/transform');
	}

	// Load data on component mount
	onMount(() => {
		// Try both methods to get data from service
		let rawData = transformedDataService.get();

		// If get() didn't work, try getData()
		if (!rawData) {
			rawData = transformedDataService.getData();
		}

		if (rawData && rawData.records && rawData.records.length > 0) {
			try {
				// Make a clean copy of the data to avoid Svelte 5 proxy issues
				const cleanData = {
					records: JSON.parse(JSON.stringify(rawData.records)),
					columnTypes: JSON.parse(JSON.stringify(rawData.columnTypes))
				};

				// Validate the data structure
				const isValidStructure = validateDataStructure(cleanData);

				if (isValidStructure) {
					localData = cleanData;
					totalRecords = cleanData.records.length; // Store total record count
					dataSource = 'store';
					debug = 'Data successfully loaded from Transform stage';
				} else {
					console.error('Data structure validation failed');
					debug = 'Error: Invalid data structure received from Transform stage';
				}
			} catch (error) {
				console.error('Error processing data:', error);
				debug = 'Error processing data: ' + error.message;
			}
		} else {
			debug = 'No data found. Please go to transform page first.';
		}
	});

	// Function to validate the data structure
	function validateDataStructure(data: any): boolean {
		// Check if data has the required properties
		if (!data || !data.records || !data.columnTypes) {
			console.error('Missing required properties in data');
			return false;
		}

		// Check if records is an array
		if (!Array.isArray(data.records)) {
			console.error('Records is not an array');
			return false;
		}

		// Check if we have any records
		if (data.records.length === 0) {
			console.error('No records found');
			return false;
		}

		// Check if columnTypes is an object
		if (typeof data.columnTypes !== 'object' || data.columnTypes === null) {
			console.error('ColumnTypes is not an object');
			return false;
		}

		// Skip detailed type validation - just make sure the basic structure is correct
		return true;
	}

	// Function to format type name for display
	function formatTypeName(type: string, header: string): string {
		// First try to determine type from the column name if header is provided
		const lowerHeader = header.toLowerCase();

		// GPS related columns
		if (lowerHeader.includes('gps')) {
			console.log(`Using GPS type for column "${header}"`);
			return 'GPS';
		}

		// Latitude/Longitude columns
		if (lowerHeader.includes('lat')) {
			console.log(`Using Latitude type for column "${header}"`);
			return 'Latitude';
		}
		if (lowerHeader.includes('lon') || lowerHeader.includes('lng')) {
			console.log(`Using Longitude type for column "${header}"`);
			return 'Longitude';
		}

		// Number columns
		if (lowerHeader.includes('number') || lowerHeader.includes('num')) {
			console.log(`Using Number type for column "${header}"`);
			return 'Number';
		}

		// Date columns
		if (
			lowerHeader.includes('date') ||
			lowerHeader.includes('time') ||
			lowerHeader.includes('dms_1')
		) {
			console.log(`Using Date type for column "${header}"`);
			return 'Date';
		}

		// If no header-based type, use the provided type
		switch (type) {
			case 'string':
				return 'String';
			case 'number':
				return 'Number';
			case 'date':
				return 'Date';
			case 'gps':
				return 'GPS';
			case 'latitude':
				return 'Latitude';
			case 'longitude':
				return 'Longitude';
			default:
				return 'String';
		}
	}
</script>

<!-- Debug info can be uncommented if needed -->
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

<div class="table-container">
	{#if localData && localData.records && localData.records.length > 0}
		<table>
			<thead>
				<tr>
					{#each Object.keys(localData.records[0]) as header}
						<th>
							<div class="header-controls">
								<span
									class="type-pseudo-select"
									data-type={formatTypeName(localData.columnTypes[header], header)}
								>
									{formatTypeName(localData.columnTypes[header], header)}
									<!-- Debug output -->
									<span style="display: none;">Raw type: {localData.columnTypes[header]}</span>
								</span>
								<span class="header-text">{header}</span>
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each localData.records.slice(0, 5) as record}
					<tr>
						{#each Object.keys(record) as key}
							<td>{record[key]}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		{#if totalRecords > 5}
			<div class="record-count-info">
				<p>Showing 5 of {totalRecords} records</p>
			</div>
		{/if}
	{:else}
		<p>
			No data available to display. <button on:click={returnToTransform}>Return to Transform</button
			>
		</p>
	{/if}
</div>

<!-- Data summary can be uncommented if needed -->
<!-- {#if localData && localData.records}
	<div class="data-summary">
		<h3>Data Summary</h3>
		<p>Total records: {localData.records.length}</p>
		<p>Columns: {Object.keys(localData.columnTypes).join(', ')}</p>
	</div>
{/if} -->

<style>
	.record-count-info {
		font-size: 0.8rem;
		color: var(--color-light-grey);
		text-align: right;
		padding: 0.5rem;
	}
</style>
