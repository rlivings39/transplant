<script lang="ts">
	import { onMount } from 'svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import type { TransformedData } from '$lib/types/transform';
	import { createEventDispatcher } from 'svelte';
	import { setupColumnDrag, addDragDropStyles } from '$lib/utils/dragColumnUtils';

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

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Format column type for display
	function formatColumnType(type: string): string {
		if (!type) return 'Unknown';
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	// Format cell value based on column type
	function formatCellValue(value: any, columnType: string): string {
		if (value === null || value === undefined) return '';

		// Handle GPS data specifically
		if (columnType === 'gps') {
			// If it's already a string, ensure it's properly formatted
			if (typeof value === 'string') {
				// Check if it's a comma-separated GPS coordinate
				if (value.includes(',')) {
					const parts = value.split(',').map((part) => part.trim());
					if (parts.length === 2) {
						const lat = Number(parts[0]);
						const lon = Number(parts[1]);
						if (!isNaN(lat) && !isNaN(lon)) {
							// Format with 7 decimal places for consistency
							return `${Number(lat.toFixed(7))}, ${Number(lon.toFixed(7))}`;
						}
					}
				}
				return value;
			}

			// If it's an object with lat/lon properties
			if (typeof value === 'object' && value !== null) {
				if ('lat' in value && 'lon' in value) {
					const lat = Number(value.lat);
					const lon = Number(value.lon);
					if (!isNaN(lat) && !isNaN(lon)) {
						return `${Number(lat.toFixed(7))}, ${Number(lon.toFixed(7))}`;
					}
					return `${value.lat}, ${value.lon}`;
				}
				if ('latitude' in value && 'longitude' in value) {
					const lat = Number(value.latitude);
					const lon = Number(value.longitude);
					if (!isNaN(lat) && !isNaN(lon)) {
						return `${Number(lat.toFixed(7))}, ${Number(lon.toFixed(7))}`;
					}
					return `${value.latitude}, ${value.longitude}`;
				}
			}

			// If it's a number or anything else, convert to string
			return String(value);
		}

		// Handle latitude/longitude specifically
		if ((columnType === 'latitude' || columnType === 'longitude') && typeof value === 'number') {
			// Format with 7 decimal places for consistency
			return Number(value.toFixed(7)).toString();
		}

		// Handle latitude/longitude as strings
		if ((columnType === 'latitude' || columnType === 'longitude') && typeof value === 'string') {
			const num = Number(value);
			if (!isNaN(num)) {
				return Number(num.toFixed(7)).toString();
			}
		}

		// Handle numbers
		if (columnType === 'number') {
			if (typeof value === 'number') {
				return value.toString();
			}
			if (typeof value === 'string') {
				const num = Number(value);
				if (!isNaN(num)) {
					return num.toString();
				}
			}
		}

		// Handle dates
		if (columnType === 'date') {
			// Try to format as a date if possible
			try {
				const date = new Date(value);
				if (!isNaN(date.getTime())) {
					return date.toISOString().split('T')[0];
				}
			} catch (e) {
				// If date parsing fails, return as is
			}
		}

		// Default case: convert to string
		return String(value);
	}

	// Helper function to get column type
	function getColumnType(header: string): string {
		return columnTypes[header] || 'string';
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
			records = rawData.records;
			columnTypes = rawData.columnTypes;
			headers = Object.keys(records[0]);
			logger.debug('Data successfully loaded from Transform stage');

			// Log data summary information
			if (DEBUG) {
				logger.debug('===== TRANSPLANT DATA VERIFICATION =====');
				logger.debug(`Total Records: ${records.length}`);
				logger.debug(`Records Displayed: ${Math.min(4, records.length)}`);
				logger.debug('First 4 Records:', records.slice(0, 4));
				logger.debug('All Records:', records);
				logger.debug('Column Types:', columnTypes);
				logger.debug('=======================================');
			} else {
				// Minimal logging when not in debug mode
				logger.info(`Loaded ${records.length} records from transform service`);
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
					{#each headers as header}
						<th
							draggable="true"
							ondragstart={(e) =>
								setupColumnDrag(e, header, getColumnType(header), records, formatColumnType)}
							ondragend={() => (draggedHeader = null)}
							class={draggedHeader === header ? 'dragging' : ''}
							style={mappedColumns.includes(header) ? 'opacity: 0.5;' : ''}
						>
							<div class="header-controls">
								<span
									class="type-pseudo-select"
									data-type={formatColumnType(getColumnType(header))}
								>
									{formatColumnType(getColumnType(header))}
								</span>
								<span class="header-text">{header}</span>
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each records.slice(0, 4) as record}
					<tr>
						{#each headers as header}
							<td
								draggable="true"
								ondragstart={(e) =>
									setupColumnDrag(e, header, getColumnType(header), records, formatColumnType)}
								ondragend={() => (draggedHeader = null)}
								style={mappedColumns.includes(header) ? 'color: var(--color-light-grey)' : ''}
							>
								{formatCellValue(record[header], getColumnType(header))}
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
</style>
