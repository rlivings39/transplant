<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CSVImporter from '$lib/transformComponents/CSVImporter.svelte';
	// Import the TransferDataTable component from the same directory
	import TransferDataTable from '$lib/transferComponents/TransferDataTable.svelte';
	import ColumnDebugPanel from '$lib/transferComponents/ColumnDebugPanel.svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { columnStore } from '$lib/stores/columnStore';
	
	// Import the data type utilities
	import * as dateType from '$lib/utils/dataTypes/dateType';
	import * as numberType from '$lib/utils/dataTypes/numberType';
	import * as gpsType from '$lib/utils/dataTypes/gpsType';
	import { nonBlankValidSampleCount } from '$lib/utils/dataTypes/validationSampleCount';
	
	// Import Column architecture
	import type { Column, ColumnBasedTransformData } from '$lib/types/columnTypes';
	import { 
		createColumn, 
		createColumnWithValues, 
		detectColumnType, 
		updateCellValidationStates,
		toggleColumn,
		changeColumnType
	} from '$lib/utils/columnUtils';
	
	// Debug flag to control logging
	const DEBUG = true;
	
	// Debug panel visibility
	let showDebugPanel = $state(true);
	
	// Logger utility for consistent and controlled logging
	const logger = {
		debug: (message: string, ...args: any[]) => {
			if (DEBUG) console.log(`[TransferManager] ${message}`, ...args);
		},
		info: (message: string, ...args: any[]) => {
			console.log(`[TransferManager] ${message}`, ...args);
		},
		warn: (message: string, ...args: any[]) => {
			console.warn(`[TransferManager] ${message}`, ...args);
		},
		error: (message: string, ...args: any[]) => {
			console.error(`[TransferManager] ${message}`, ...args);
		}
	};
	
	// Event dispatcher
	const dispatch = createEventDispatcher();
	
	// State
	let rawData = $state<Array<Record<string, string>>>([]);
	let columns = $state<Column[]>([]);
	let isProcessing = $state(false);
	
	// Handle CSV data load
	function handleCsvDataLoad(event: { detail: { data: Array<Record<string, string>>, headers: string[] } }) {
		const { data, headers } = event.detail;
		logger.info(`CSV data loaded: ${data.length} rows, ${headers.length} columns`);
		
		rawData = data;
		
		// Process the data into columns
		processRawData(data, headers);
	}
	
	// Process raw data into columns
	function processRawData(data: Array<Record<string, string>>, headers: string[]) {
		if (isProcessing) return;
		isProcessing = true;
		
		try {
			// Create columns from the raw data
			columns = headers.map(header => {
				// Extract values for this column
				const values = data.map(row => row[header] || '');
				
				// Detect the column type using the dataTypes utilities
				const type = detectColumnTypeFromSamples(header, values);
				
				// Process values based on detected type
				const processedValues = values.map(value => {
					if (!value) return null;
					
					if (type === 'gps') {
						// Convert GPS coordinates to numbers with 7 decimal precision
						const numValue = Number(value);
						if (!isNaN(numValue)) {
							// Round to 7 decimal places
							return Number(numValue.toFixed(7));
						}
						
						// Handle lat,lon format
						if (value.includes(',')) {
							const parts = value.split(',').map(part => part.trim());
							if (parts.length === 2) {
								const lat = Number(parts[0]);
								const lon = Number(parts[1]);
								if (!isNaN(lat) && !isNaN(lon)) {
									// Format with 7 decimal places
									return `${Number(lat.toFixed(7))},${Number(lon.toFixed(7))}`;
								}
							}
						}
						
						return value; // Return original if conversion failed
					} else if (type === 'number') {
						// Convert to actual number
						const numValue = Number(value);
						return !isNaN(numValue) ? numValue : value;
					} else {
						return value;
					}
				});
				
				// Create a column with the detected type and processed values
				const column = createColumnWithValues(header, type, processedValues);
				
				// Add type-specific properties
				if (type === 'gps') {
					// Cast to GpsColumn to set GPS-specific properties
					const gpsColumn = column as any;
					gpsColumn.precision = 7; // Set GPS precision to 7 decimal places
					gpsColumn.gpsFormat = 'decimal';
				} else if (type === 'number') {
					// Cast to NumberColumn to set number-specific properties
					const numberColumn = column as any;
					numberColumn.precision = 2; // Default precision for numbers
				}
				
				// Update cell validation states
				return updateCellValidationStates(column);
			});
			
			logger.info(`Created ${columns.length} columns with types`);
			
			// Dispatch the processed data event
			dispatch('dataProcessed', {
				columns
			});
		} catch (error) {
			logger.error('Error processing raw data:', error);
		} finally {
			isProcessing = false;
		}
	}
	
	// Detect column type using the dataTypes utilities
	function detectColumnTypeFromSamples(header: string, samples: string[]): 'string' | 'number' | 'date' | 'gps' {
		// Get a subset of non-blank samples for detection
		const validSamples = samples
			.filter(s => s && s.trim())
			.slice(0, nonBlankValidSampleCount);
		
		if (validSamples.length === 0) return 'string';
		
		// Check for GPS type first (including lat/lon)
		const gpsTypeResult = gpsType.detectType(header, validSamples);
		if (gpsTypeResult === 'gps' || gpsTypeResult === 'latitude' || gpsTypeResult === 'longitude') {
			return 'gps';
		}
		
		// Check for date type
		if (validSamples.some(sample => {
			try {
				return !isNaN(new Date(sample).getTime());
			} catch {
				return false;
			}
		})) {
			return 'date';
		}
		
		// Check for number type
		if (validSamples.every(sample => {
			const num = Number(sample);
			return !isNaN(num) && isFinite(num);
		})) {
			return 'number';
		}
		
		// Default to string
		return 'string';
	}
	
	// Handle column type change
	function handleColumnTypeChange(event: { detail: { columnName: string, newType: 'string' | 'number' | 'date' | 'gps' } }) {
		const { columnName, newType } = event.detail;
		
		// Find the column
		const columnIndex = columns.findIndex(col => col.name === columnName);
		if (columnIndex === -1) return;
		
		// Change the column type
		columns[columnIndex] = changeColumnType(columns[columnIndex], newType);
		
		// Update the columns array to trigger reactivity
		columns = [...columns];
		
		logger.info(`Changed column ${columnName} type to ${newType}`);
	}
	
	// Handle column toggle
	function handleColumnToggle(event: { detail: { columnName: string, isToggled: boolean } }) {
		const { columnName, isToggled } = event.detail;
		
		// Find the column
		const columnIndex = columns.findIndex(col => col.name === columnName);
		if (columnIndex === -1) return;
		
		// Toggle the column
		columns[columnIndex] = toggleColumn(columns[columnIndex], isToggled);
		
		// Update the columns array to trigger reactivity
		columns = [...columns];
		
		logger.info(`Toggled column ${columnName} ${isToggled ? 'on' : 'off'}`);
	}
	
	// Export data to TransPlant
	function exportToTransplant() {
		logger.info('Exporting data to TransPlant');
		
		try {
			// Process columns before export to ensure proper type handling
			const processedColumns = columns.map(column => {
				// Skip processing if column is null or undefined
				if (!column) {
					logger.warn('Skipping null or undefined column');
					return null;
				}

				// Make a deep copy to avoid modifying the original
				let processedColumn = JSON.parse(JSON.stringify(column));
				
				// Ensure column has a valid type
				if (!processedColumn.type) {
					logger.warn(`Column ${processedColumn.name} has no type, defaulting to string`);
					processedColumn.type = 'string';
				}
				
				// Ensure all columns have proper validation states
				try {
					processedColumn = updateCellValidationStates(processedColumn);
				} catch (error) {
					logger.error(`Error updating validation states for column ${processedColumn.name}:`, error);
				}
				
				// Special handling for GPS columns to ensure numeric precision
				if (processedColumn.type === 'gps') {
					try {
						// Cast to GpsColumn to access GPS-specific properties
						const gpsColumn = processedColumn;
						
						// Ensure GPS values are properly formatted as numbers with 7 decimal places
						if (Array.isArray(gpsColumn.values)) {
							gpsColumn.values = gpsColumn.values.map((value: any) => {
								if (value === null || value === undefined) return null;
								
								try {
									// If it's already a GpsCoordinate object
									if (typeof value === 'object' && value !== null && 'latitude' in value && 'longitude' in value) {
										// Round to 7 decimal places
										return {
											latitude: Number(Number(value.latitude).toFixed(7)),
											longitude: Number(Number(value.longitude).toFixed(7)),
											format: 'decimal',
											precision: 7
										};
									}
									
									// If it's a string with lat,lon format
									if (typeof value === 'string' && value.includes(',')) {
										const parts = value.split(',').map(part => part.trim());
										if (parts.length === 2) {
											const lat = Number(parts[0]);
											const lon = Number(parts[1]);
											if (!isNaN(lat) && !isNaN(lon)) {
												return {
													latitude: Number(lat.toFixed(7)),
													longitude: Number(lon.toFixed(7)),
													format: 'decimal',
													precision: 7
												};
											}
										}
									}
									
									return value;
								} catch (error) {
									logger.error(`Error processing GPS value: ${value}`, error);
									return null;
								}
							});
						}
						
						// Ensure format properties are set
						gpsColumn.gpsFormat = gpsColumn.gpsFormat || 'decimal';
						gpsColumn.precision = gpsColumn.precision || 7;
						
						processedColumn = gpsColumn;
					} catch (error) {
						logger.error(`Error processing GPS column ${processedColumn.name}:`, error);
					}
				} else if (processedColumn.type === 'number') {
					try {
						// Cast to NumberColumn to access number-specific properties
						const numberColumn = processedColumn;
						
						// Ensure number values are actually numbers, not strings
						if (Array.isArray(numberColumn.values)) {
							numberColumn.values = numberColumn.values.map((value: any) => {
								if (value === null || value === undefined) return null;
								
								try {
									// Convert string numbers to actual numbers
									if (typeof value === 'string') {
										const numValue = Number(value);
										return !isNaN(numValue) ? numValue : null; // Return null for invalid numbers
									}
									
									return typeof value === 'number' ? value : null;
								} catch (error) {
									logger.error(`Error processing number value: ${value}`, error);
									return null;
								}
							});
						}
						
						processedColumn = numberColumn;
					} catch (error) {
						logger.error(`Error processing number column ${processedColumn.name}:`, error);
					}
				}
			
			return processedColumn;
		});
		
			// Filter out any null columns
			const filteredColumns = processedColumns.filter(col => col !== null);
			
			// Create the column-based data structure
			const columnBasedData: ColumnBasedTransformData = {
				columns: filteredColumns
			};
			
			// Log the data for debugging
			logger.debug('Exporting column-based data structure');
			
			// Store in the column store for TransPlant to access
			columnStore.set(columnBasedData);
			
			// Also store in the legacy service for backward compatibility
			transformedDataService.set(columnBasedData);
			
			// Dispatch the data ready event
			dispatch('dataReady', {
				columns: columnBasedData.columns
			});
			
			logger.info('Successfully exported data to TransPlant');
			return columnBasedData;
		} catch (error) {
			logger.error('Error exporting data to TransPlant:', error);
			// Return a minimal valid structure to avoid 500 errors
			return { columns: [] };
		}
	}
	
	// Set up event listener for export-to-transplant event
	$effect(() => {
		if (typeof window !== 'undefined') {
			const handleExportEvent = () => {
				exportToTransplant();
			};
			
			// Add event listener to the transfer-manager div
			const transferManagerElement = document.querySelector('.transfer-manager');
			if (transferManagerElement) {
				transferManagerElement.addEventListener('export-to-transplant', handleExportEvent);
				
				// Clean up when component is destroyed
				return () => {
					transferManagerElement.removeEventListener('export-to-transplant', handleExportEvent);
				};
			}
		}
	});
</script>

<div class="transfer-manager">
	<CSVImporter on:dataLoaded={(e) => {
		// Handle the event with correct typing
		const data = e.detail.data;
		// Extract headers from the first row if not provided
		const headers = data.length > 0 ? Object.keys(data[0]) : [];
		handleCsvDataLoad({ detail: { data, headers } });
	}} />
	
	{#if columns.length > 0}
		<TransferDataTable 
			{columns}
			on:columnTypeChange={handleColumnTypeChange}
			on:columnToggle={handleColumnToggle}
		/>
		
		<!-- Toggle Debug Panel Button -->
		<div class="debug-panel-toggle">
			<button onclick={exportToTransplant} class="export-button">
				Export to TransPlant
			</button>
			<button onclick={() => showDebugPanel = !showDebugPanel} class="debug-button">
				{showDebugPanel ? 'Hide' : 'Show'} Debug Panel
			</button>
		</div>
		
		<!-- Column Debug Panel -->
		{#if showDebugPanel}
			<ColumnDebugPanel columns={columns} />
		{/if}
	{:else}
		<div class="no-data-message">
			<p>Import a CSV file to get started</p>
		</div>
	{/if}
</div>

<style>
	.transfer-manager {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
	}
	
	.no-data-message {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200px;
		border-radius: 4px;
		/* color: #666 */
	}
	
	.debug-panel-toggle {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	
	.export-button {
		background-color: var(--color-primary, #4caf50);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-weight: 500;
	}
	
	.export-button:hover {
		background-color: var(--color-primary-dark, #388e3c);
	}
	
	.debug-button {
		background-color: #673ab7;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-weight: 500;
	}
	
	.debug-button:hover {
		background-color: #5e35b1;
	}
</style>
