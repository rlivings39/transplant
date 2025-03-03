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
	let csvDataLoaded = $state(false);

	// Function to receive data from TransformManager component
	function handleTransformedData(event) {
		// Get the data from the event
		const { records, columnTypes } = event.detail;

		// console.log('Received transformed data:', records);
		// console.log('Column types:', columnTypes);

		// Update local state
		transformedRecords = records;
		columnTypeMap = columnTypes;
	}

	// Function to handle CSV data loaded event
	function handleCsvLoaded() {
		csvDataLoaded = true;
	}

	// Function to send data to TransPlant
	function sendToTransplant() {
		// console.log('Push Data to Console button clicked');

		// Try to get data from the table directly if no transformed data is available
		if (transformedRecords.length === 0) {
			// console.log('No transformed data in state, trying to get data from table');

			// Get all table rows
			const tableRows = document.querySelectorAll('table tr');

			if (tableRows.length <= 1) {
				// Account for header row
				// console.log('No rows found in table');
				alert('No data available. Please transform data first.');
				return;
			}

			// First, identify which columns are toggled off (completely disabled)
			const toggledOffColumns = new Set();
			const headerRow = tableRows[0];
			const headerCells = headerRow.querySelectorAll('th');

			// Check each header's toggle checkbox
			headerCells.forEach((th) => {
				const headerNameDiv = th.querySelector('.header-name');
				if (!headerNameDiv) return;

				const headerName = headerNameDiv.textContent?.trim() || '';
				if (headerName === 'GPS' || headerName === '') return;

				// Check if the column has its checkbox unchecked
				const checkbox = th.querySelector('input[type="checkbox"]') as HTMLInputElement;
				if (checkbox && !checkbox.checked) {
					toggledOffColumns.add(headerName);
					// console.log(`Column "${headerName}" is toggled off`);
				}
			});

			// Get headers from the first row, excluding toggled-off columns
			const headers = Array.from(headerRow.querySelectorAll('th'))
				.map((th) => {
					// Get the header name div which contains the actual text
					const headerNameDiv = th.querySelector('.header-name');
					return headerNameDiv ? headerNameDiv.textContent?.trim() || '' : '';
				})
				.filter((header) => header !== 'GPS' && header !== '' && !toggledOffColumns.has(header)); // Filter out GPS, empty headers, and toggled-off columns

			// console.log('Headers after filtering toggled-off columns:', headers);

			// Get data from remaining rows
			const records = [];
			for (let i = 1; i < tableRows.length; i++) {
				const row = tableRows[i];
				const cells = row.querySelectorAll('td');

				// Create a new record
				const record = {};
				let hasValidData = false;

				// Process each header and find its corresponding cell
				headers.forEach((header, headerIndex) => {
					// Find the index of this header in the original table
					let cellIndex = -1;
					for (let j = 0; j < headerCells.length; j++) {
						const headerNameDiv = headerCells[j].querySelector('.header-name');
						if (headerNameDiv && headerNameDiv.textContent?.trim() === header) {
							cellIndex = j;
							break;
						}
					}

					// Skip if we couldn't find the header
					if (cellIndex === -1) return;

					// Get the corresponding cell (add 1 to account for GPS column)
					const cell = cells[cellIndex];
					if (!cell) return;

					// Check if this cell is greyed out due to type validation failure
					if (cell.classList.contains('greyed-out')) {
						// For type validation failures, set value to null but keep the column
						record[header] = null;
						return;
					}

					// Cell is valid, extract its value
					const value = cell.textContent?.trim() || '';

					// Try to convert to number if it looks like one
					if (/^-?\d+(\.\d+)?$/.test(value)) {
						record[header] = parseFloat(value);
					} else {
						record[header] = value;
					}

					hasValidData = true;
				});

				// Only add records that have at least one valid cell
				if (hasValidData) {
					records.push(record);
				}
			}

			// Get column types from the data - all as strings to avoid validation issues
			const columnTypes = {};
			headers.forEach((header) => {
				// Default all to string to avoid validation issues
				columnTypes[header] = 'string';
			});

			// console.log('Scraped records:', records);
			// console.log('Detected column types:', columnTypes);

			// Update local state
			transformedRecords = records;
			columnTypeMap = columnTypes;
		}

		// Create a clean copy of the data without Svelte 5 proxies
		const cleanRecords = JSON.parse(JSON.stringify(transformedRecords));
		const cleanColumnTypes = JSON.parse(JSON.stringify(columnTypeMap));

		// Create validated data object
		const validatedData = {
			records: cleanRecords,
			columnTypes: cleanColumnTypes
		};

		// Log the data to console in a clean format
		// console.log('CLEAN DATA BEING SENT:');
		// console.log('Records:', JSON.stringify(cleanRecords, null, 2));
		// console.log('Column Types:', JSON.stringify(cleanColumnTypes, null, 2));

		// Save to store
		transformedDataService.set(validatedData);
		// console.log('Clean transformed data saved to store:', validatedData);

		// Navigate to TransPlant
		goto('/transplant');
	}
</script>

<div class="transform-container">
	<div class="transform-header">
		<h1>Transform Data</h1>
		{#if csvDataLoaded}
			<button onclick={sendToTransplant}> Transform </button>
		{/if}
	</div>
	<TransformManager on:dataTransformed={handleTransformedData} on:csvLoaded={handleCsvLoaded} />
</div>

<style>
	.transform-header {
		width: 100%;
		padding: 1rem 0;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>
