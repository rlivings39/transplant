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

	// Interface for DOM-extracted data
	interface DomExtractedData {
		metadata: {
			totalRecords: number;
			exportTime: string;
			columnTypes: Record<string, string>;
		};
		headers: string[];
		selectorTypes: Record<string, string>;
		records: Array<Record<string, any>>;
	}

	// Local state using runes
	let transformedRecords = $state([]);
	let columnTypeMap = $state({});
	let csvDataLoaded = $state(false);

	// Function to receive data from TransformManager component
	function handleTransformedData(event) {
		// Get the data from the event
		const { records, columnTypes } = event.detail;

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
		// Extract data from the DOM table
		try {
			// Get all table rows
			const tableRows = document.querySelectorAll('table tbody tr');

			if (tableRows.length === 0) {
				alert('No table rows found. Please transform data first.');

				// Fall back to using transformed records if available
				if (transformedRecords.length === 0) {
					return;
				}
			}

			// Get headers from the table head
			const headerCells = document.querySelectorAll('table thead th');

			if (headerCells.length === 0) {
				alert('No header cells found. Please transform data first.');

				// Fall back to using transformed records if available
				if (transformedRecords.length === 0) {
					return;
				}
			}
			// Extract headers and selector types
			const tableHeaders = [];
			const selectorTypes = {};

			headerCells.forEach((th) => {
				// Get the header name
				const headerNameDiv = th.querySelector('.header-name');
				if (!headerNameDiv) return;

				const headerName = headerNameDiv.textContent?.trim() || '';
				if (headerName === 'GPS' || headerName === '') return;

				tableHeaders.push(headerName);

				// Get the selector type from the select element
				const selectElement = th.querySelector('select') as HTMLSelectElement;
				if (selectElement) {
					selectorTypes[headerName] = selectElement.value || 'string';
				} else {
					// Fallback to column type from state
					selectorTypes[headerName] = columnTypeMap[headerName] || 'string';
				}
			});

			// Extract data from rows
			const extractedRecords = [];

			tableRows.forEach((row) => {
				const cells = row.querySelectorAll('td');

				// Create a new record
				const record = {};
				let hasValidData = false;

				tableHeaders.forEach((header) => {
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

					// Get the corresponding cell
					const cell = cells[cellIndex];
					if (!cell) return;

					// Check if this cell is greyed out due to type validation failure
					const isGreyedOut = cell.classList.contains('greyed-out');

					// Extract the value
					const value = cell.textContent?.trim() || '';

					// Try to convert to number if it looks like one and isn't greyed out
					if (!isGreyedOut && /^-?\d+(\.\d+)?$/.test(value)) {
						record[header] = parseFloat(value);
					} else {
						record[header] = isGreyedOut ? null : value;
					}

					if (!isGreyedOut && value) {
						hasValidData = true;
					}
				});

				// Only add records that have at least one valid cell
				if (hasValidData) {
					extractedRecords.push(record);
				}
			});

			// Create a DOM-extracted data object
			const domExtractedData = {
				metadata: {
					totalRecords: extractedRecords.length,
					exportTime: new Date().toISOString(),
					columnTypes: selectorTypes
				},
				headers: tableHeaders,
				selectorTypes: selectorTypes,
				records: extractedRecords
			};

			// If we have DOM-extracted data, use it
			if (extractedRecords.length > 0) {
				// Create validated data object for the regular transplant flow
				const validatedData = {
					records: extractedRecords,
					columnTypes: selectorTypes
				};

				// Save both the regular data and DOM extracted data to store
				transformedDataService.set(validatedData);
				transformedDataService.setDomExtractedData(domExtractedData);

				// Navigate to TransPlant
				goto('/transplant');
				return;
			}
		} catch (err) {
			alert('Error extracting data: ' + err.message);
		}

		// If DOM extraction fails or no data is found, fall back to using transformed records
		if (transformedRecords.length > 0) {
			// Create a clean copy of the data without Svelte 5 proxies
			const cleanRecords = JSON.parse(JSON.stringify(transformedRecords));
			const cleanColumnTypes = JSON.parse(JSON.stringify(columnTypeMap));

			// Create validated data object
			const validatedData = {
				records: cleanRecords,
				columnTypes: cleanColumnTypes
			};

			// Save to store
			transformedDataService.set(validatedData);

			// Navigate to TransPlant
			goto('/transplant');
		} else {
			alert('No data available. Please transform data first.');
		}
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
