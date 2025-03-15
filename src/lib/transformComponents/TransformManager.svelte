<script lang="ts">
	import * as dateType from '$lib/utils/dataTypes/dateType';
	import * as numberType from '$lib/utils/dataTypes/numberType';
	import * as gpsType from '$lib/utils/dataTypes/gpsType';
	import { nonBlankValidSampleCount } from '$lib/utils/dataTypes/validationSampleCount';
	import CSVImporter from './CSVImporter.svelte';
	import type { CsvPreviewEvent } from '$lib/types/transformTypes';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { createEventDispatcher } from 'svelte';
	import type {
		StringColumn,
		NumberColumn,
		DateColumn,
		GpsColumn,
		GpsCoordinate,
		CellValidationState
	} from '$lib/types/columnTypes';
	import type { Column } from '$lib/types/columnModel';
	import ColumnDebugPanel from './ColumnDebugPanelTransform.svelte';
	import TransformDataTable from './transformDataTable.svelte';

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
	// Column debug panel state
	let columnsForDebug = $state<Column[]>([]);
	let showDebugPanel = $state(false);

	interface TransformedData {
		records: Array<Record<string, any>>;
		columnTypes: Record<string, string>;
		toggledColumns?: Record<string, boolean>;
		columns?: Column[];
	}

	// Update canTransform whenever data or invalidCells changes
	$effect(() => {
		canTransform = data.length > 0 && Object.keys(invalidCells).length === 0;
	});

	// Convert current data to Column format for debugging
	function convertToColumnFormat(): Column[] {
		const columns: Column[] = [];

		// Get all column headers
		if (data.length === 0) return columns;
		const headers = Object.keys(data[0]);

		// Check for potential GPS coordinate pairs (lat/lon)
		const lowerCaseHeaders = headers.map((h) => h.toLowerCase());
		// const hasLatitude = lowerCaseHeaders.some((h) => h.includes('lat'));
		// const hasLongitude = lowerCaseHeaders.some((h) => h.includes('lon'));
		// const potentialGpsPair = hasLatitude && hasLongitude;

		// Create a column object for each header
		for (const header of headers) {
			const lowerHeader = header.toLowerCase();
			// Auto-detect GPS columns if not already set
			// if (
			// 	potentialGpsPair &&
			// 	(lowerHeader.includes('lat') || lowerHeader.includes('lon')) &&
			// 	!columnTypes[header]
			// ) {
			// 	columnTypes[header] = 'gps';
			// }

			const type = columnTypes[header] || 'string';
			const isToggled = toggledColumns[header] !== false; // Default to true if not specified

			// Extract values for this column
			let values;

			if (type === 'string') {
				// String column
				values = data.map((row) => {
					const value = row[header];
					return value === null || value === undefined ? null : String(value);
				});

				// Create the string column
				const stringColumn: StringColumn = {
					headerName: header,
					type: 'string',
					isToggled,
					isFormatted: true,
					values,
					cellValidation: createCellValidation(header, isToggled)
				};

				columns.push(stringColumn);
			} else if (type === 'number') {
				// Number column
				values = data.map((row) => {
					const value = row[header];
					if (value === null || value === undefined || value === '') return null;
					const numValue = Number(value);
					return isNaN(numValue) ? null : numValue;
				});

				// Create the number column with format initialized
				const numberColumn: NumberColumn = {
					headerName: header,
					type: 'number',
					isToggled,
					isFormatted: true,
					values,
					cellValidation: createCellValidation(header, isToggled),
					format: { precision: 2 }
				};

				// Check if this is a coordinate column
				if (lowerHeader.includes('lat')) {
					numberColumn.coordinateType = 'latitude';
					numberColumn.coordinatePrecision = 7;
					// Format is guaranteed to exist since we initialized it above
					numberColumn.format!.precision = 7;
				} else if (lowerHeader.includes('lon')) {
					numberColumn.coordinateType = 'longitude';
					numberColumn.coordinatePrecision = 7;
					// Format is guaranteed to exist since we initialized it above
					numberColumn.format!.precision = 7;
				}

				columns.push(numberColumn);
			} else if (type === 'date') {
				// Date column
				values = data.map((row) => {
					const value = row[header];
					return value === null || value === undefined || value === '' ? null : String(value);
				});

				// Create the date column
				const dateColumn: DateColumn = {
					headerName: header,
					type: 'date',
					isToggled,
					isFormatted: true,
					values,
					cellValidation: createCellValidation(header, isToggled),
					format: { dateFormat: 'YYYY-MM-DD' }
				};

				columns.push(dateColumn);
			} else if (type === 'gps') {
				// GPS column
				if (lowerHeader.includes('lat') || lowerHeader.includes('lon')) {
					// This is a lat/lon component, handle it as a number
					values = data.map((row) => {
						const value = row[header];
						if (value === null || value === undefined || value === '') return null;
						const numValue = Number(value);
						return isNaN(numValue) ? null : numValue;
					});

					// Create the number column for lat/lon
					const numberColumn: NumberColumn = {
						headerName: header,
						type: 'number',
						isToggled,
						isFormatted: true,
						values,
						cellValidation: createCellValidation(header, isToggled),
						format: { precision: 7 },
						coordinateType: lowerHeader.includes('lat') ? 'latitude' : 'longitude',
						coordinatePrecision: 7
					};

					columns.push(numberColumn);
				} else {
					// Full GPS column with lat/lon pairs
					values = data.map((row) => {
						const value = row[header];
						if (value === null || value === undefined || value === '') return null;

						// Check if it's already a GPS object
						if (
							typeof value === 'object' &&
							value !== null &&
							'latitude' in value &&
							'longitude' in value
						) {
							// Type assertion to help TypeScript understand this is a GpsCoordinate
							const gpsValue = value as { latitude: number | string; longitude: number | string };
							return {
								latitude: Number(Number(gpsValue.latitude).toFixed(7)),
								longitude: Number(Number(gpsValue.longitude).toFixed(7))
							};
						}

						// Check if it's a string with comma-separated coordinates
						if (typeof value === 'string' && value.includes(',')) {
							const [lat, lon] = value.split(',').map((v) => Number(v.trim()));
							if (!isNaN(lat) && !isNaN(lon)) {
								return {
									latitude: Number(lat.toFixed(7)),
									longitude: Number(lon.toFixed(7))
								};
							}
						}

						return null; // Invalid GPS format
					});

					// Create the GPS column
					const gpsColumn: GpsColumn = {
						headerName: header,
						type: 'gps',
						isToggled,
						isFormatted: true,
						values,
						cellValidation: createCellValidation(header, isToggled),
						format: {
							gpsFormat: 'DD',
							precision: 7
						}
					};

					columns.push(gpsColumn);
				}
			}
		}

		// Create a helper function for cell validation
		function createCellValidation(header: string, isToggled: boolean): CellValidationState[] {
			return data.map((row, index) => {
				const isValid = !invalidCells[header]?.has(index);
				return {
					rowIndex: index,
					isValid,
					failedSelectDetection: !isValid,
					isGreyedOut: !isValid || !isToggled,
					originalValue: row[header]
				};
			});
		}

		return columns;
	}

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

		// Create Column objects for the transformed data
		const columns = convertToColumnFormat();

		// Dispatch the transformed data event with the current state
		dispatch('dataTransformed', {
			records: transformedData,
			columnTypes: columnTypes,
			toggledColumns: toggledColumns,
			columns: columns // Include the Column objects
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

				// Extract the actual column types from the DOM
				console.log('COLUMN TYPES: Processing headers from DOM:', headers);

				// Look for type indicators in the DOM
				const typeSelectors = table.querySelectorAll('.type-selector');
				const typeMap: Record<string, string> = {};

				// First try to extract types from the type-selector elements in the DOM
				Array.from(typeSelectors).forEach((selector) => {
					const headerElement = selector.closest('th');
					const header = headerElement?.textContent?.trim() || '';
					const selectedElement = selector.querySelector('.selected');
					const selectedType = selectedElement?.getAttribute('data-type') || '';

					if (header && selectedType) {
						typeMap[header] = selectedType;
						console.log(`COLUMN TYPES: Found type selector for ${header}: ${selectedType}`);
					} else {
						console.warn(
							`COLUMN TYPES: Missing type information for header: ${header}, selected element:`,
							selectedElement
						);
					}
				});

				// Check if all type selectors have the same type (which would be suspicious)
				const typeValues = Object.values(typeMap);
				const uniqueTypes = new Set(typeValues);

				if (uniqueTypes.size === 1 && typeValues.length > 1) {
					console.error(
						`COLUMN TYPES: WARNING - All ${typeValues.length} columns have the same type: ${typeValues[0]}. ` +
							`This is likely an error. Will attempt to infer types from header names instead.`
					);

					// If all columns have the same type and it's suspicious, clear the typeMap
					// and we'll rely on header name inference instead
					Object.keys(typeMap).forEach((key) => {
						delete typeMap[key];
					});
				}

				// Now process each header
				headers.forEach((header) => {
					// First check if we found a type in the DOM
					if (typeMap[header]) {
						// Validate the type is one of our supported types
						const validType = ['string', 'number', 'date', 'gps'].includes(typeMap[header])
							? (typeMap[header] as 'string' | 'number' | 'date' | 'gps')
							: ('string' as 'string');

						domColumnTypes[header] = validType;
						console.log(`COLUMN TYPES: Using DOM type for ${header}: ${domColumnTypes[header]}`);
					}
					// Then check if we have a type in our columnTypes state
					else if (columnTypes[header]) {
						// Validate the type is one of our supported types
						const validType = ['string', 'number', 'date', 'gps'].includes(columnTypes[header])
							? (columnTypes[header] as 'string' | 'number' | 'date' | 'gps')
							: ('string' as 'string');

						domColumnTypes[header] = validType;
						console.log(`COLUMN TYPES: Using stored type for ${header}: ${domColumnTypes[header]}`);
					}
					// Otherwise infer from header name
					else {
						const lowerHeader = header.toLowerCase();
						// Check for GPS indicators first (most specific)
						if (
							header === 'GPS' ||
							lowerHeader.includes('gps') ||
							lowerHeader === 'lat' ||
							lowerHeader === 'lon' ||
							lowerHeader === 'latitude' ||
							lowerHeader === 'longitude'
						) {
							// All GPS-related types should be 'gps' to match the ColumnType type
							domColumnTypes[header] = 'gps' as 'gps';
							console.log(`COLUMN TYPES: Set GPS type for ${header} (includes lat/lon)`);
						}
						// Check for date indicators in header name
						else if (
							lowerHeader.includes('date') ||
							lowerHeader.includes('time') ||
							lowerHeader === 'when' ||
							lowerHeader.includes('year')
						) {
							domColumnTypes[header] = 'date' as 'date';
							console.log(`COLUMN TYPES: Inferred date type for ${header}`);
						}
						// Check for number indicators
						else if (
							lowerHeader.includes('count') ||
							lowerHeader.includes('number') ||
							lowerHeader.includes('amount') ||
							lowerHeader.includes('/ha')
						) {
							domColumnTypes[header] = 'number' as 'number';
							console.log(`COLUMN TYPES: Inferred number type for ${header}`);
						}
						// Default to string for everything else
						else {
							domColumnTypes[header] = 'string' as 'string';
							console.log(`COLUMN TYPES: Defaulting to string type for ${header}`);
						}
					}
				});

				// Verify we don't have all the same type (which would be suspicious)
				const finalTypeValues = Object.values(domColumnTypes);
				const finalUniqueTypes = new Set(finalTypeValues);

				if (finalUniqueTypes.size === 1 && finalTypeValues.length > 1) {
					console.warn(
						`COLUMN TYPES: After inference, all ${finalTypeValues.length} columns still have the same type: ${finalTypeValues[0]}. ` +
							`This might be correct if all columns are truly the same type, but is unusual.`
					);
				}

				// Add additional debug logging to help diagnose issues
				console.log(
					'COLUMN TYPES: DOM column types before export:',
					JSON.stringify(domColumnTypes, null, 2)
				);

				// Log the final column types with a distinct prefix for easy filtering
				console.log('COLUMN TYPES: Final types for export:', domColumnTypes);

				// Get all visible rows
				const bodyRows = table.querySelectorAll('tbody tr');
				if (bodyRows.length === 0) {
					console.error('DOM debug: No rows found in the table body');
					return null;
				}

				console.log(`DOM debug: Found ${bodyRows.length} rows in the table`);

				// Extract data from each row
				const records: Array<Record<string, string | number | null>> = [];
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
									const parts = value.split(',').map((part) => part.trim());
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
									// Use type assertion to ensure TypeScript knows value is a number
									const numValue = value as number;
									filteredRow[header] = Number(numValue.toFixed(7));
								} else if (value === null || value === undefined) {
									filteredRow[header] = null;
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

		console.log(
			'COLUMN TYPES: Exporting data with',
			Object.keys(domData.columnTypes).length,
			'columns'
		);
		console.log('COLUMN TYPES: Export column types:', domData.columnTypes);

		// Log a sample record for debugging
		if (domData.records.length > 0) {
			console.log('COLUMN TYPES: Sample record keys:', Object.keys(domData.records[0]));
		}

		// Add additional validation before storing in the service
		// This ensures we're not accidentally setting all types to the same value
		const typeValues = Object.values(exportData.columnTypes);
		const uniqueTypes = new Set(typeValues);

		if (uniqueTypes.size === 1 && typeValues.length > 1) {
			// If all columns have the same type and there's more than one column, this is suspicious
			console.error(
				`COLUMN TYPES: WARNING - All ${typeValues.length} columns have the same type: ${typeValues[0]}. ` +
					`This is likely an error. Check the type extraction logic.`
			);
		}

		// Log the final export data with types for debugging
		console.log('COLUMN TYPES: Final export data:', {
			recordCount: exportData.records.length,
			columnTypes: exportData.columnTypes
		});

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
		<TransformDataTable
			rows={transformedData}
			{invalidCells}
			{columnTypes}
			{toggledColumns}
			oncolumnTypeChange={handleTypeChange}
			oncolumnToggle={handleColumnToggle}
		/>
	{:else}
		<div class="no-data-message">
			<p></p>
		</div>
	{/if}

	<!-- Toggle Debug Panel Button -->
	{#if data.length > 0}
		<div class="debug-panel-toggle">
			<button
				onclick={() => {
					showDebugPanel = !showDebugPanel;
					if (showDebugPanel) {
						columnsForDebug = convertToColumnFormat();
					}
				}}
			>
				{showDebugPanel ? 'Hide' : 'Show'} Column Debug Panel
			</button>
		</div>

		<!-- Column Debug Panel -->
		{#if showDebugPanel}
			<ColumnDebugPanel columns={columnsForDebug} />
		{/if}
	{/if}
</div>
