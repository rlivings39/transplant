<script lang="ts">
	import * as dateType from '$lib/utils/dataTypes/dateType';
	import * as numberType from '$lib/utils/dataTypes/numberType';
	import * as gpsType from '$lib/utils/dataTypes/gpsType';
	import { nonBlankValidSampleCount } from '$lib/utils/dataTypes/validationSampleCount';
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';
	import type { CsvPreviewEvent } from '$lib/types/transformTypes';
	import { goto } from '$app/navigation';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { createEventDispatcher } from 'svelte';

	// Create event dispatcher
	const dispatch = createEventDispatcher<{
		dataTransformed: TransformedData;
		csvLoaded: void;
		toggledColumnsUpdate: Record<string, boolean>;
		exportedData: TransformedData;
	}>();

	// States
	let originalData = $state<Record<string, string>[]>([]);
	let data = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let toggledColumns = $state<Record<string, boolean>>({});
	const props = $props<{ toggledColumns?: Record<string, boolean> }>();
	$effect(() => {
		if (props.toggledColumns) {
			toggledColumns = props.toggledColumns;
		}
	});
	let invalidCells = $state<Record<string, Set<number>>>({});
	let transformedData = $state<Record<string, string>[]>([]);
	let canTransform = $state(false);
	// Add a flag to track if we're currently processing data
	let isProcessing = $state(false);

	interface TransformedData {
		records: Array<Record<string, any>>;
		columnTypes: Record<string, string>;
		toggledColumns?: Record<string, boolean>;
	}

	// Update canTransform whenever data or invalidCells changes
	$effect(() => {
		canTransform = data.length > 0 && Object.keys(invalidCells).length === 0;
	});

	// Type detection pipeline in priority order
	const typeDetectors = [
		{ detect: gpsType.detectType, handler: gpsType },
		{ detect: dateType.detectType, handler: dateType },
		{ detect: numberType.detectType, handler: numberType }
	];

	function csvDataLoad(event: CsvPreviewEvent<'csvLoaded'>) {
		// Reset all state
		columnTypes = {};
		toggledColumns = {};
		invalidCells = {};
		transformedData = [];
		data = [];
		originalData = [];

		// Load the new data
		originalData = event.detail.data.map((row) => ({ ...row }));
		data = originalData;

		// Dispatch csvLoaded event
		dispatch('csvLoaded');
	}

	// Initialize types and validation on data change
	$effect(() => {
		// Return early if no data or already processing
		if (!data.length || isProcessing) return;

		const headers = Object.keys(data[0]);
		let typeChanged = false;

		headers.forEach((header) => {
			if (!columnTypes[header]) {
				// Only detect and set the type if it's not already set
				const samples = data
					.map((row) => row[header]?.trim())
					.filter((value) => value)
					.slice(0, nonBlankValidSampleCount);

				let detectedType = null;

				for (const { detect } of typeDetectors) {
					detectedType = detect(header, samples);
					if (detectedType) break;
				}

				// Set type once
				if (detectedType) {
					columnTypes[header] = detectedType;
					typeChanged = true;
				} else {
					columnTypes[header] = 'string';
					typeChanged = true;
				}
			}
		});

		// Only validate if types were actually changed or this is initial load
		if (typeChanged || transformedData.length === 0) {
			validateAndTransformData();
		}
	});

	// Single-pass validation and transformation
	function validateAndTransformData() {
		// Set processing flag to prevent re-entry
		if (isProcessing) return;
		isProcessing = true;

		const newInvalidCells: Record<string, Set<number>> = {};
		const newTransformedData = data.map((row, rowIndex) => {
			const newRow: Record<string, string> = {};

			for (const [header, type] of Object.entries(columnTypes)) {
				const value = row[header] || '';

				// Skip validation for blank cells
				if (!value.trim()) {
					newRow[header] = value;
					continue;
				}

				// String columns accept everything
				if (type === 'string') {
					newRow[header] = value;
					continue;
				}

				// Completely separate GPS handling
				if (type === 'gps' || type === 'latitude' || type === 'longitude') {
					const result = gpsType.validateAndFormat(header, value);
					if (!result.isValid || result.type !== type) {
						if (!newInvalidCells[header]) newInvalidCells[header] = new Set();
						newInvalidCells[header].add(rowIndex);
						newRow[header] = value;
					} else {
						newRow[header] = result.formattedValue || value;
					}
					continue;
				}

				// Handle dates and numbers separately
				if (type === 'date') {
					const result = dateType.validateAndFormat(header, value);
					if (!result.isValid || result.type !== 'date') {
						if (!newInvalidCells[header]) newInvalidCells[header] = new Set();
						newInvalidCells[header].add(rowIndex);
						newRow[header] = value;
					} else {
						newRow[header] = result.formattedValue || value;
					}
					continue;
				}

				if (type === 'number') {
					const result = numberType.validateAndFormat(header, value);
					if (!result.isValid || result.type !== 'number') {
						if (!newInvalidCells[header]) newInvalidCells[header] = new Set();
						newInvalidCells[header].add(rowIndex);
						newRow[header] = value;
					} else {
						newRow[header] = result.formattedValue || value;
					}
					continue;
				}

				if (!newInvalidCells[header]) newInvalidCells[header] = new Set();
				newInvalidCells[header].add(rowIndex);
				newRow[header] = value;
			}

			return newRow;
		});

		invalidCells = newInvalidCells;
		transformedData = newTransformedData;

		// Dispatch the transformed data event with the current state
		dispatch('dataTransformed', {
			records: transformedData,
			columnTypes: columnTypes,
			toggledColumns: toggledColumns
		});

		// Reset processing flag
		isProcessing = false;
	}

	// Handle manual type selection change
	function handleTypeChange(event: CsvPreviewEvent<'columnTypeChange'>) {
		const { columnHeader, type } = event.detail;
		columnTypes = { ...columnTypes, [columnHeader]: type };
		validateAndTransformData();
	}

	// Handle column toggle
	function handleColumnToggle(event: CsvPreviewEvent<'columnToggle'>) {
		const { columnHeader, isActive } = event.detail;
		toggledColumns = { ...toggledColumns, [columnHeader]: !isActive };
		validateAndTransformData();
	}

	// Export data to TransPlant, filtering out toggled-off columns entirely
	export function exportToTransplant() {
		console.log('Exporting data to TransPlant');

		// Extract data directly from the DOM table
		const extractDataFromDOM = () => {
			try {
				// Debug DOM structure to find tables
				console.log('DOM debug: Looking for tables in the document');
				const allTables = document.querySelectorAll('table');
				console.log(`DOM debug: Found ${allTables.length} tables in the document`);

				// Log table details to help identify the correct one
				Array.from(allTables).forEach((table, index) => {
					const rows = table.querySelectorAll('tr').length;
					const cols = table.querySelector('tr')?.querySelectorAll('th, td').length || 0;
					console.log(`DOM debug: Table ${index}: ${rows} rows, ${cols} columns`);
				});

				// Try to find the table with our data
				let table = null;

				// If we have exactly one table, use it
				if (allTables.length === 1) {
					table = allTables[0];
					console.log('DOM debug: Using the only table found in the document');
				}
				// If we have multiple tables, try to find the one with our data
				else if (allTables.length > 1) {
					// Look for a table with headers that match our column types
					for (let i = 0; i < allTables.length; i++) {
						const headerCells = allTables[i].querySelectorAll('thead th');
						if (headerCells.length > 0) {
							const headers = Array.from(headerCells).map((th) =>
								th.textContent ? th.textContent.trim() : ''
							);
							// Check if this table has headers that match our column types
							const matchingHeaders = headers.filter((header) => columnTypes[header]);
							if (matchingHeaders.length > 0) {
								table = allTables[i];
								console.log(
									`DOM debug: Found table ${i} with ${matchingHeaders.length} matching headers`
								);
								break;
							}
						}
					}

					// If we still don't have a table, use the one with the most rows
					if (!table) {
						let maxRows = 0;
						let maxRowsIndex = 0;
						for (let i = 0; i < allTables.length; i++) {
							const rowCount = allTables[i].querySelectorAll('tr').length;
							if (rowCount > maxRows) {
								maxRows = rowCount;
								maxRowsIndex = i;
							}
						}
						table = allTables[maxRowsIndex];
						console.log(`DOM debug: Using table ${maxRowsIndex} with the most rows (${maxRows})`);
					}
				}

				if (!table) {
					console.error('DOM debug: No table found in the document');
					return null;
				}

				// Get all headers from the table
				const headerCells = table.querySelectorAll('thead th');
				if (headerCells.length === 0) {
					console.error('DOM debug: No header cells found in the table');
					return null;
				}

				const headers = Array.from(headerCells).map((th) =>
					th.textContent ? th.textContent.trim() : ''
				);
				console.log('DOM debug: Headers found:', headers);

				// Define a type for column types
				type ColumnType = 'string' | 'number' | 'date' | 'gps';

				// Define an interface for the domColumnTypes object to allow string indexing
				interface ColumnTypeMap {
					[key: string]: ColumnType;
				}

				// Get column types from our existing types or infer from content
				const domColumnTypes: ColumnTypeMap = {};

				// Debug the column names
				console.log('DOM debug: Column names being processed:', headers);

				// First, let's log the existing column types for reference
				console.log('DOM debug: Existing column types:', columnTypes);

				headers.forEach((header) => {
					// Use existing column type if available
					if (columnTypes[header]) {
						domColumnTypes[header] = columnTypes[header];
					}
					// Otherwise infer from header name
					else {
						// Special case for the first GPS column
						if (header === 'GPS') {
							domColumnTypes[header] = 'gps';
						}
						// Special case for GPS DD column
						else if (header.includes('GPS DD')) {
							domColumnTypes[header] = 'gps';
						}
						// Special case for GPS DMS column
						else if (header.includes('GPS DMS')) {
							domColumnTypes[header] = 'gps';
						}
						// Special case for GPS UTM column
						else if (header.includes('GPS UTM')) {
							domColumnTypes[header] = 'gps';
						}
						// Special case for other columns - use string as default
						else {
							domColumnTypes[header] = 'string';
						}
					}
				});

				// Log the final column types
				console.log('DOM debug: Final column types:', domColumnTypes);

				// Get all visible rows
				const bodyRows = table.querySelectorAll('tbody tr');
				if (bodyRows.length === 0) {
					console.error('DOM debug: No rows found in the table body');
					return null;
				}

				console.log(`DOM debug: Found ${bodyRows.length} rows in the table`);

				// Extract data from each row
				const records = [];
				bodyRows.forEach((row) => {
					// Skip hidden rows
					if (row.classList.contains('hidden') || window.getComputedStyle(row).display === 'none') {
						return;
					}

					const cells = row.querySelectorAll('td');
					if (cells.length === 0) {
						return; // Skip rows with no cells
					}

					// Define record with proper type to avoid TypeScript errors
					const record: { [key: string]: string | number | null } = {};

					// Map each cell to its corresponding header
					cells.forEach((cell, index) => {
						if (index < headers.length) {
							const header = headers[index];
							const value = cell.textContent?.trim() || '';

							// Process based on column type
							if (domColumnTypes[header] === 'gps') {
								// Special handling for GPS DMS_1 and GPS DD_ fields - ensure they're numbers
								if (header.includes('GPS DMS_1') || header.includes('GPS DD_')) {
									const num = Number(value);
									if (!isNaN(num)) {
										// Round to 7 decimal places for precision
										record[header] = Number(num.toFixed(7));
									} else {
										record[header] = value;
									}
								} 
								// For GPS coordinates with lat,lon format
								else if (value.includes(',')) {
									const parts = value.split(',').map(part => part.trim());
									if (parts.length === 2) {
										const lat = Number(parts[0]);
										const lon = Number(parts[1]);
										if (!isNaN(lat) && !isNaN(lon)) {
											// Format with 7 decimal places as per requirements
											record[header] = `${Number(lat.toFixed(7))},${Number(lon.toFixed(7))}`;
										} else {
											record[header] = value;
										}
									} else {
										record[header] = value;
									}
								} else {
									record[header] = value;
								}
							} else if (domColumnTypes[header] === 'number') {
								// Convert to number if possible
								const num = Number(value);
								record[header] = isNaN(num) ? value : num;
							} else {
								record[header] = value;
							}
						}
					});

					// Only add records with data
					if (Object.keys(record).length > 0) {
						records.push(record);
					}
				});

				if (records.length === 0) {
					console.error('DOM debug: No records extracted from the table');
					return null;
				}

				// Log a sample for debugging
				console.log('DOM debug: First record:', records[0]);
				console.log('DOM debug: Column types:', domColumnTypes);

				return {
					records,
					columnTypes: domColumnTypes
				};
			} catch (error) {
				console.error('Error extracting data from DOM:', error);
				return null;
			}
		};

		// Try to extract from DOM first, fall back to transformed data if that fails
		const domData = extractDataFromDOM();
		if (!domData || !domData.records || domData.records.length === 0) {
			console.warn('DOM extraction failed, falling back to transformed data');

			if (transformedData.length === 0) {
				console.error('No transformed data available to export');
				return null;
			}

			// Use the transformed data as fallback
			const filteredRecords = transformedData.map((row) => {
				// Define filteredRow with proper type to avoid TypeScript errors
				const filteredRow: { [key: string]: string | number | null } = {};
				Object.entries(row).forEach(([header, value]) => {
					// Only include columns that are not toggled off
					if (!toggledColumns[header]) {
						// Process GPS data to ensure proper formatting
						if (columnTypes[header] === 'gps') {
							// Special handling for GPS DMS_1 and GPS DD_ fields - ensure they're numbers
							if (header.includes('GPS DMS_1') || header.includes('GPS DD_')) {
								if (typeof value === 'string') {
									const num = Number(value);
									if (!isNaN(num)) {
										// Round to 7 decimal places for precision
										filteredRow[header] = Number(num.toFixed(7));
									} else {
										filteredRow[header] = value;
									}
								} else if (typeof value === 'number') {
									// Already a number, just ensure precision
									filteredRow[header] = Number(value.toFixed(7));
								} else {
									filteredRow[header] = value;
								}
							}
							// For GPS coordinates with lat,lon format
							else if (typeof value === 'string' && value.includes(',')) {
								const parts = value.split(',').map((part) => part.trim());
								if (parts.length === 2) {
									const lat = Number(parts[0]);
									const lon = Number(parts[1]);
									if (!isNaN(lat) && !isNaN(lon)) {
										// Format with 7 decimal places as per requirements
										filteredRow[header] = `${Number(lat.toFixed(7))},${Number(lon.toFixed(7))}`;
									} else {
										filteredRow[header] = value;
									}
								} else {
									filteredRow[header] = value;
								}
							} else {
								filteredRow[header] = value;
							}
						}
						// Handle number fields
						else if (columnTypes[header] === 'number') {
							if (typeof value === 'string') {
								const num = Number(value);
								if (!isNaN(num)) {
									filteredRow[header] = num; // Store as actual number
								} else {
									filteredRow[header] = value;
								}
							} else if (typeof value === 'number') {
								filteredRow[header] = value; // Already a number
							} else {
								filteredRow[header] = value;
							}
						}
						// Pass other values through as-is
						else {
							filteredRow[header] = value;
						}
					}
				});

				return filteredRow;
			});

			// Also filter column types to match
			const filteredColumnTypes: ColumnTypeMap = {};
			Object.entries(columnTypes).forEach(([header, type]) => {
				if (!toggledColumns[header]) {
					filteredColumnTypes[header] = type;
				}
			});

			// Create the final data structure
			const exportData = {
				records: filteredRecords,
				columnTypes: filteredColumnTypes
			};

			console.log(
				'Exported data from transformed data:',
				Object.keys(filteredColumnTypes).length,
				'columns'
			);
			
			// Log a sample record for debugging
			console.log('Sample record:', filteredRecords.length > 0 ? filteredRecords[0] : 'No records');

			// Store in the service for TransPlant to access
			transformedDataService.set(exportData);
			return exportData;
		}

		// Process the DOM data
		const exportData = {
			records: domData.records,
			columnTypes: domData.columnTypes
		};

		console.log('Exported data from DOM:', Object.keys(domData.columnTypes).length, 'columns');
		
		// Log a sample record for debugging
		console.log('Sample DOM record:', domData.records.length > 0 ? domData.records[0] : 'No records');

		// Store in the service for TransPlant to access
		transformedDataService.set(exportData);
		return exportData;
	}

	// Set up event listener for export-to-transplant event
	$effect(() => {
		if (typeof window !== 'undefined') {
			const handleExportEvent = () => {
				exportToTransplant();
			};

			// Add event listener to the transform-manager div
			const transformManagerElement = document.querySelector('.transform-manager');
			if (transformManagerElement) {
				transformManagerElement.addEventListener('export-to-transplant', handleExportEvent);

				// Clean up when component is destroyed
				return () => {
					transformManagerElement.removeEventListener('export-to-transplant', handleExportEvent);
				};
			}
		}
	});
</script>

<div class="transform-manager">
	<CSVImporter on:dataLoaded={csvDataLoad} />

	{#if data.length}
		<DataPreviewTable
			rows={transformedData}
			{invalidCells}
			{columnTypes}
			{toggledColumns}
			on:columnTypeChange={handleTypeChange}
			on:columnToggle={handleColumnToggle}
		/>
	{:else}
		<div class="no-data-message">
			<p></p>
		</div>
	{/if}
</div>
