<script lang="ts">
	import { onMount } from 'svelte';
	import TransplantDataTable from '$lib/transplantComponents/transplantDataTable.svelte';
	import TransplantDbTargetTable from '$lib/transplantComponents/transplantDbTargetTable.svelte';
	import ColumnDebugPanel from '$lib/transplantComponents/ColumnDebugPanelTransplant.svelte';
	import { schemaService } from '$lib/services/schemaService';
	import { transformedDataService } from '$lib/stores/transformStore';
	import type { Column } from '$lib/types/columnModel';
	import type {
		ColumnBasedTransformData,
		GpsColumn,
		NumberColumn
	} from '$lib/types/columnTypes';
	// import { convertLegacyToColumnBased } from '$lib/utils/columnUtils';

	// Debug flag to control logging
	const DEBUG = true;

	// Logger utility for consistent and controlled logging
	const logger = {
		debug: (message: string, ...args: any[]) => {
			if (DEBUG) console.log(`[TransplantPage] ${message}`, ...args);
		},
		info: (message: string, ...args: any[]) => {
			console.log(`[TransplantPage] ${message}`, ...args);
		},
		warn: (message: string, ...args: any[]) => {
			console.warn(`[TransplantPage] ${message}`, ...args);
		},
		error: (message: string, ...args: any[]) => {
			console.error(`[TransplantPage] ${message}`, ...args);
		}
	};

	// State for drag-and-drop coordination
	let draggedColumn = $state<{ header: string; columnType: string; column?: Column } | null>(null);

	// Add state for schema loading
	let isSchemaLoading = $state(true);
	let schemaError = $state<string | null>(null);
	let hasTransformData = $state(false);

	// Add state for tracking mapped columns
	let mappedColumns = $state<string[]>([]);

	// Add state for Column-based data
	let columnBasedData = $state<ColumnBasedTransformData | null>(null);

	// Add state for debug panel
	let showDebugPanel = $state(true);

	// Add state for columns to display in debug panel
	let columnsForDebug = $state<Column[]>([]);

	// Handle drag start from the data table
	function handleDragStart(event: CustomEvent) {
		const { header, columnType, column } = event.detail;
		draggedColumn = { header, columnType, column };
	}

	// Handle drag end
	function handleDragEnd() {
		draggedColumn = null;
	}

	// Handle successful mapping
	function handleMappingCreated(event: CustomEvent) {
		const { csvColumn, tableName, fieldName, mappedColumns: newMappedColumns } = event.detail;

		// Update the list of mapped columns
		if (newMappedColumns && Array.isArray(newMappedColumns)) {
			mappedColumns = [...newMappedColumns];
		} else if (csvColumn) {
			// If mappedColumns not provided, just add the current column
			if (!mappedColumns.includes(csvColumn)) {
				mappedColumns = [...mappedColumns, csvColumn];
			}
		}
	}

	// Process columns to ensure proper data types
	function processColumns(columns: Column[]): Column[] {
		return columns.map((column) => {
			// Create a copy of the column to avoid modifying the original
			const processedColumn = { ...column };

			// Process GPS columns
			if (column.type === 'gps') {
				const gpsColumn = processedColumn as GpsColumn;

				// Ensure values are properly formatted as numbers with 7 decimal places
				gpsColumn.values = gpsColumn.values.map((value) => {
					if (value && typeof value === 'object' && 'latitude' in value && 'longitude' in value) {
						// Convert string coordinates to numbers and round to 7 decimal places
						const lat =
							typeof value.latitude === 'string' ? parseFloat(value.latitude) : value.latitude;
						const lon =
							typeof value.longitude === 'string' ? parseFloat(value.longitude) : value.longitude;

						return {
							latitude: Number(lat.toFixed(7)),
							longitude: Number(lon.toFixed(7))
						};
					}
					return value;
				});

				// Set format precision if not already set
				if (!gpsColumn.format) {
					gpsColumn.format = { precision: 7 };
				} else if (!gpsColumn.format.precision) {
					gpsColumn.format.precision = 7;
				}
			}

			// Process number columns
			if (column.type === 'number') {
				const numberColumn = processedColumn as NumberColumn;

				// Ensure values are properly formatted as numbers
				numberColumn.values = numberColumn.values.map((value) => {
					if (typeof value === 'string') {
						return parseFloat(value);
					}
					return value;
				});

				// Set format precision if not already set
				if (!numberColumn.format) {
					numberColumn.format = { precision: 2 };
				} else if (!numberColumn.format.precision) {
					numberColumn.format.precision = 2;
				}
			}

			return processedColumn;
		});
	}

	// Initialize schema service on component mount
	onMount(async () => {
		// Check if we have transform data - simplify to just use get()
		const transformData = transformedDataService.get();
		hasTransformData = !!transformData;
		console.log('[TransPlant Debug] Has transform data:', hasTransformData);
		
		// Log the raw transformed data directly to console for debugging
		console.log('[TransPlant Debug] Raw Transform Data:', transformData);
		
		// Also log the raw data from the store for comparison
		const storeData = transformedDataService.get();
		console.log('[TransPlant Debug] Raw Store Data:', storeData);

		// If we have transform data, check if it's already in Column-based format
		if (transformData) {
			if ('columns' in transformData) {
				// It's already in Column-based format
				columnBasedData = transformData as ColumnBasedTransformData;

				// Process columns to ensure proper data types
				columnBasedData.columns = processColumns(columnBasedData.columns);

				// Set columns for debug panel
				columnsForDebug = columnBasedData.columns;

				logger.debug('Data is already in Column-based format');
				logger.debug('Processed columns:', columnsForDebug);
			} else if ('columns' in transformData && 'records' in transformData && 'columnTypes' in transformData) {
				// It has both column-based and legacy format data
				console.log('[TransPlant Debug] Found both column-based and legacy data:', {
					columnsCount: transformData.columns?.length || 0,
					recordsCount: transformData.records?.length || 0,
					columnTypeCount: Object.keys(transformData.columnTypes || {}).length
				});

				// Directly use the column-based data without conversion
				columnBasedData = {
					columns: transformData.columns
				};

				// Process columns to ensure proper data types
				columnBasedData.columns = processColumns(columnBasedData.columns);

				// Set columns for debug panel
				columnsForDebug = columnBasedData.columns;

				// Log the column-based data we're using
				console.log('[TransPlant Debug] Using Column-Based Data Directly:', {
					columnsCount: columnBasedData.columns?.length || 0,
					sampleColumn: columnBasedData.columns?.[0] || null
				});
			} else if ('records' in transformData && 'columnTypes' in transformData) {
				// It's in legacy format only, convert it
				// Log detailed information about the legacy data before conversion
				console.log('[TransPlant Debug] Legacy Data Structure Only:', {
					recordsCount: transformData.records?.length || 0,
					columnTypeCount: Object.keys(transformData.columnTypes || {}).length,
					columnTypes: transformData.columnTypes,
					sampleRecord: transformData.records?.[0] || null
				});
				
				try {
				/* Commented out during transition to new column architecture
					columnBasedData = convertLegacyToColumnBased({
						records: transformData.records,
						columnTypes: transformData.columnTypes
					});

					// Log the raw column-based data after conversion
					console.log('[TransPlant Debug] Raw Column-Based Data After Conversion:', {
						columnsCount: columnBasedData.columns?.length || 0,
						sampleColumn: columnBasedData.columns?.[0] || null
					});

					// Process columns to ensure proper data types
					columnBasedData.columns = processColumns(columnBasedData.columns);

					// Set columns for debug panel
					columnsForDebug = columnBasedData.columns;

					// Log the processed column data
					console.log('[TransPlant Debug] Processed Column Data:', {
						columnsCount: columnsForDebug?.length || 0,
						columnTypes: columnsForDebug?.map(col => ({ name: col.name, type: col.type })) || [],
						sampleColumn: columnsForDebug?.[0] || null
					});

					logger.debug('Successfully converted legacy data to Column-based format');
					logger.debug('Processed columns:', columnsForDebug);
						*/
				} catch (error) {
					logger.error(
						'Error converting to Column-based format:',
						error instanceof Error ? error.message : String(error)
					);
				}
			}
		}

		try {
			// Initialize schema service
			const schemaData = await schemaService.loadSchemaMetadata();

			if (!schemaData) {
				schemaError = 'Failed to load schema metadata. Please try again.';
				logger.warn('Schema data failed to load');
			} else {
				logger.debug('Schema metadata loaded successfully');
			}
		} catch (error) {
			logger.error('Error loading schema metadata:', error);
			schemaError = error.message || 'Unknown error loading schema metadata';
		} finally {
			isSchemaLoading = false;
		}
	});
</script>

<div class="actions">
	
	
	<p class="description">
		Drag'n'drop columns to database tables below. Just try! We can fix it later 😎️
	</p>
	<div class="button-container">
		<button class="primary" onclick={() => alert('Save to database functionality coming soon!')}>
			Save to Database
		</button>
		<button onclick={() => (window.location.href = '/transform')}> Back to Transform </button>
	</div>
</div>
<div class="container">
	<h3>Imported Data</h3>

	{#if !hasTransformData}
		<div class="warning-message">
			<p>No transform data available. Please go to the Transform page first.</p>
			<button onclick={() => (window.location.href = '/transform')}> Go to Transform </button>
		</div>
	{:else}
		<TransplantDataTable
			on:dragStart={handleDragStart}
			on:dragEnd={handleDragEnd}
			{mappedColumns}
		/>
		<h3
			style="color: var(--color-purple) ; padding: 0.25rem; border-radius: 0.25rem; margin-top: 1rem; text-align: center;"
		>
			⬇ ⬇ ⬇ ⬇ Drag Columns to Database ⬇ ⬇ ⬇ ⬇
		</h3>

		{#if isSchemaLoading}
			<div class="loading-indicator">
				<p>Loading database schema...</p>
			</div>
		{:else if schemaError}
			<div class="error-message">
				<p>Error: {schemaError}</p>
				<button onclick={() => window.location.reload()}>Retry</button>
			</div>
		{:else}
			<TransplantDbTargetTable {draggedColumn} on:mappingCreated={handleMappingCreated} />
		{/if}
	{/if}
</div>


<!-- Column Debug Panel -->

	<ColumnDebugPanel columns={columnsForDebug} />


<style>
	.persistent-state-container {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 0.25rem;
	}

	.persistent-state-container h3 {
		margin-top: 0;
		color: #495057;
	}

	#persistent-state-display {
		background-color: #212529;
		color: #f8f9fa;
		padding: 1rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		font-family: monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.description {
		/* text-align: left; */
		margin-top: -1rem;
		margin-bottom: 0;
	}

	.actions {
		margin-top: 2rem;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.debug-panel-toggle {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
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

	h2 {
		margin-top: -0.5rem;
	}

	.description {
		margin-bottom: 0;
		color: #666;
		font-size: 0.9rem;
	}

	.button-container {
		display: flex;
		gap: 1rem;
	}

	button {
		margin-top: -3em;
		padding: 0.5rem 1rem;
		/* border: 1px solid #ddd; */
		border-radius: 4px;
		background-color: var(--color-purple);
		cursor: pointer;
	}

	/* button:hover {
		background-color: #e5e5e5 5;
	} */

	button.primary {
		background-color: #4caf50;
		color: white;
		border: none;
	}

	button.primary:hover {
		background-color: #3d9140;
	}

	.loading-indicator {
		padding: 1rem;
		background-color: #f0f0f0;
		border-radius: 4px;
		text-align: center;
		margin: 1rem 0;
	}

	.error-message {
		padding: 1rem;
		background-color: #ffebee;
		border: 1px solid #ffcdd2;
		border-radius: 4px;
		color: #c62828;
		margin: 1rem 0;
	}

	.warning-message {
		padding: 1rem;
		background-color: #fff8e1;
		border: 1px solid #ffe082;
		border-radius: 4px;
		color: #ff8f00;
		margin: 1rem 0;
		text-align: center;
	}
</style>
