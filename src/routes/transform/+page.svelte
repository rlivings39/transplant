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

	// Function to receive data from TransformManager component
	function handleTransformedData(event) {
		// Get the data from the event
		const { records, columnTypes } = event.detail;

		console.log('Received transformed data:', records);
		console.log('Column types:', columnTypes);

		// Update local state
		transformedRecords = records;
		columnTypeMap = columnTypes;
	}

	// Function to send data to TransPlant
	function sendToTransplant() {
		console.log('Push Data to Console button clicked');

		// Try to get data from the table directly if no transformed data is available
		if (transformedRecords.length === 0) {
			console.log('No transformed data in state, trying to get data from table');

			// Get all visible table rows (not greyed out)
			const tableRows = document.querySelectorAll('table tr:not(.greyed-out)');

			if (tableRows.length <= 1) {
				// Account for header row
				console.log('No visible rows found in table');
				alert('No data available. Please transform data first.');
				return;
			}

			// Get headers from the first row
			const headerRow = tableRows[0];
			const headers = Array.from(headerRow.querySelectorAll('th')).map(
				(th) => th.textContent?.trim() || ''
			);

			// Get data from remaining rows
			const records = [];
			for (let i = 1; i < tableRows.length; i++) {
				const row = tableRows[i];
				const cells = row.querySelectorAll('td');

				if (cells.length === headers.length) {
					const record = {};

					headers.forEach((header, index) => {
						// Skip empty headers
						if (!header) return;

						const cell = cells[index];
						const value = cell.textContent?.trim() || '';

						// Try to convert to number if it looks like one
						if (/^-?\d+(\.\d+)?$/.test(value)) {
							record[header] = parseFloat(value);
						} else {
							record[header] = value;
						}
					});

					records.push(record);
				}
			}

			// Get column types from the data - all as strings to avoid validation issues
			const columnTypes = {};
			headers.forEach((header) => {
				// Default all to string to avoid validation issues
				columnTypes[header] = 'string';
			});

			console.log('Scraped records:', records);
			console.log('Detected column types:', columnTypes);

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
		console.log('CLEAN DATA BEING SENT:');
		console.log('Records:', JSON.stringify(cleanRecords, null, 2));
		console.log('Column Types:', JSON.stringify(cleanColumnTypes, null, 2));

		// Save to store
		transformedDataService.set(validatedData);
		console.log('Clean transformed data saved to store:', validatedData);

		// Navigate to TransPlant
		goto('/transplant');
	}
</script>

<div class="transform-container">
	<div class="transform-header">
		<h1>TransForm Data Import</h1>
	</div>
	<TransformManager on:dataTransformed={handleTransformedData} />

	<div class="validation-controls">
		<button class="send-to-transplant-button" on:click={sendToTransplant}>
			Send Transformed Data to TransPlant
		</button>
		<p class="help-text">
			This button will send the transformed data to the TransPlant page for mapping and import.
		</p>
	</div>
</div>

<style>
	.transform-container {
		width: 100%;
	}

	.transform-header {
		width: 100%;
		padding: 1rem 0;
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.validation-controls {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #e3f2fd;
		border-radius: 4px;
		border-left: 4px solid #2196f3;
	}

	.help-text {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #666;
	}

	.send-to-transplant-button {
		background-color: #2196f3;
		color: white;
		padding: 10px 15px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		font-size: 1rem;
	}

	.send-to-transplant-button:hover {
		background-color: #0b7dda;
	}
</style>
