<script lang="ts">
	import { onMount } from 'svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import type { TransformedData } from '$lib/types/transform';
	import { createEventDispatcher } from 'svelte';
	import { setupColumnDrag, addDragDropStyles } from '$lib/utils/dragColumnUtils';
	import { convertLegacyToColumnBased } from '$lib/utils/columnUtils';
	import type { Column, ColumnBasedTransformData, GpsColumn, NumberColumn, DateColumn, StringColumn } from '$lib/types/columnTypes';

	// Debug flag to control logging
	const DEBUG = true;

	// Logger utility for consistent and controlled logging
	const logger = {
		info: (message: string, ...args: any[]) => {
			console.log(`[TransplantDataTable] ${message}`, ...args);
		},
		debug: (message: string, ...args: any[]) => {
			if (DEBUG) {
				console.log(`[TransplantDataTable Debug] ${message}`, ...args);
			}
		},
		error: (message: string, ...args: any[]) => {
			console.error(`[TransplantDataTable Error] ${message}`, ...args);
		}
	};

	// Props
	export let mappedColumns: string[] = [];

	// Local state
	let records: Record<string, any>[] = [];
	let columnTypes: Record<string, string> = {};
	let headers: string[] = [];
	let draggedHeader: string | null = null;
	let dragOverHeader: string | null = null;
	
	// Column architecture state
	let columnBasedData: ColumnBasedTransformData | null = null;
	let columns: Column[] = [];

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Format column type for display
	function formatColumnType(type: string): string {
		if (!type) return 'Unknown';
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	// Format cell value based on column
	function formatCellValue(column: Column, rowIndex: number): string {
		const value = column.values[rowIndex];
		if (value === null || value === undefined) return '';

		// Handle different column types
		switch (column.type) {
			case 'gps':
				const gpsColumn = column as GpsColumn;
				if (typeof value === 'object' && value !== null && 'latitude' in value && 'longitude' in value) {
					const lat = Number(value.latitude);
					const lon = Number(value.longitude);
					if (!isNaN(lat) && !isNaN(lon)) {
						// Use the column's format settings
						const precision = gpsColumn.format?.precision || 7;
						return `${Number(lat.toFixed(precision))}, ${Number(lon.toFixed(precision))}`;
					}
				}
				return String(value);
			
			case 'number':
				const numberColumn = column as NumberColumn;
				if (typeof value === 'number') {
					// Use the column's format settings
					const precision = numberColumn.format?.precision || 2;
					return Number(value.toFixed(precision)).toString();
				}
				return String(value);
			
			case 'date':
				const dateColumn = column as DateColumn;
				if (value instanceof Date && !isNaN(value.getTime())) {
					return value.toISOString().split('T')[0];
				}
				return String(value);
			
			case 'string':
				return String(value);
			
			default:
				return String(value);
		}
	}

	// Helper function to get column by name
	function getColumnByName(name: string): Column | undefined {
		return columns.find(col => col.name === name);
	}
	
	// Helper function to get column type
	function getColumnType(header: string): string {
		const column = getColumnByName(header);
		return column ? column.type : (columnTypes[header] || 'string');
	}

	// Load data on component mount
	onMount(() => {
		// Add drag-drop styles
		addDragDropStyles();

		// Try both methods to get data from service
		let rawData = transformedDataService.get();

		// If get() didn't work, try getData()
		if (!rawData) {
			rawData = transformedDataService.getData();
		}

		if (rawData && rawData.records && rawData.records.length > 0) {
			// Store the legacy data for reference
			records = rawData.records;
			columnTypes = rawData.columnTypes;
			
			// Convert legacy data to Column-based format
			try {
				columnBasedData = convertLegacyToColumnBased({
					records: rawData.records,
					columnTypes: rawData.columnTypes
				});
				
				// Get the columns and filter out any that aren't toggled
				columns = columnBasedData.columns.filter(col => col.isToggled);
				
				// Update headers based on column names
				headers = columns.map(col => col.name);
				
				logger.debug('Data successfully converted to Column-based format');
				logger.debug('Column-based data:', columnBasedData);
			} catch (error) {
				logger.error('Error converting to Column-based format:', error);
				
				// Fallback to legacy data if conversion fails
				headers = Object.keys(records[0]);
				logger.debug('Falling back to legacy data format');
			}

			// Log data summary information
			if (DEBUG) {
				logger.debug('===== TRANSPLANT DATA VERIFICATION =====');
				logger.debug(`Total Records: ${records.length}`);
				logger.debug(`Records Displayed: ${Math.min(4, records.length)}`);
				logger.debug(`Total Columns: ${columns.length}`);
				logger.debug('Columns:', columns);
				logger.debug('=======================================');
			} else {
				// Minimal logging when not in debug mode
				logger.info(`Loaded ${records.length} records with ${columns.length} columns`);
			}
		} else {
			logger.error('No data found. Please go to transform page first.');
		}
	});
</script>

<!-- Debug info can be uncommented if needed -->
<!-- <div class="debug-info">
	<h3>Debug Information</h3>
	<p><strong>Data source:</strong> {dataSource}</p>
	<p><strong>Debug status:</strong> {debug}</p>
	<p><strong>Data available:</strong> {localData ? 'Yes' : 'No'}</p>
	{#if localData}
		<p><strong>Records:</strong> {localData.records?.length || 0}</p>
	{/if}
</div> -->

<div class="table-container">
	{#if records && records.length > 0}
		<table>
			<thead>
				<tr>
					{#each columns as column}
						<th
							draggable="true"
							ondragstart={(e) =>
								setupColumnDrag(e, column.name, column.type, records, formatColumnType)}
							ondragend={() => (draggedHeader = null)}
							class={draggedHeader === column.name ? 'dragging' : ''}
							style={mappedColumns.includes(column.name) ? 'opacity: 0.5;' : ''}
						>
							<div class="header-controls">
								<span
									class="type-pseudo-select"
									data-type={formatColumnType(column.type)}
								>
									{formatColumnType(column.type)}
								</span>
								<span class="header-text">{column.name}</span>
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each Array(Math.min(4, records.length)) as _, rowIndex}
					<tr>
						{#each columns as column}
							<td
								draggable="true"
								ondragstart={(e) =>
									setupColumnDrag(e, column.name, column.type, records, formatColumnType)}
								ondragend={() => (draggedHeader = null)}
								style={mappedColumns.includes(column.name) ? 'color: var(--color-light-grey)' : ''}
								class={column.cellValidation && column.cellValidation[rowIndex]?.isValid === false ? 'invalid-cell' : ''}
							>
								{formatCellValue(column, rowIndex)}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p>No data available to display.</p>
	{/if}
</div>

<style>
	/* Style for the dragging state */
	.dragging {
		opacity: 0.5;
	}

	/* Cursor styles for drag and drop */
	[draggable='true'] {
		cursor: grab;
	}

	[draggable='true']:active {
		cursor: grabbing;
	}
	
	/* Style for invalid cells */
	.invalid-cell {
		background-color: rgba(255, 0, 0, 0.1);
	}
</style>
