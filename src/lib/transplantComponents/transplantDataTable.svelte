<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { goto } from '$app/navigation';
	import { setupColumnDrag, addDragDropStyles } from '$lib/utils/dragColumnUtils';

	// Debug flag to control logging
	const DEBUG = false;

	// Logger utility for consistent and controlled logging
	const logger = {
		debug: (message: string, ...args: any[]) => {
			if (DEBUG) console.log(`[TransplantDataTable] ${message}`, ...args);
		},
		info: (message: string, ...args: any[]) => {
			console.log(`[TransplantDataTable] ${message}`, ...args);
		},
		warn: (message: string, ...args: any[]) => {
			console.warn(`[TransplantDataTable] ${message}`, ...args);
		},
		error: (message: string, ...args: any[]) => {
			console.error(`[TransplantDataTable] ${message}`, ...args);
		}
	};

	// Event dispatcher
	const dispatch = createEventDispatcher();

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
	let localData = $state<ValidatedTransformData | null>(null);
	let dataSource = $state('none');
	let debug = $state('Waiting for data...');
	let totalRecords = $state(0); // Track total number of records

	// Constant for maximum rows to show in the UI
	const maxRowsToShow = 4;

	// Add drag state
	let draggedHeader = $state<string | null>(null);

	// Accept mappedColumns as a prop using $props() rune
	const { mappedColumns = [] } = $props<{ mappedColumns?: string[] }>();

	// Function to return to transform page
	function returnToTransform() {
		// Clear data and navigate back
		transformedDataService.clear();
		goto('/transform');
	}

	// Get column type for a header
	function getColumnType(header: string): string {
		if (!localData || !localData.columnTypes) return 'string';

		// Special case handling based on header name
		// if (header.startsWith('GPS')) return 'gps';
		// if (header === 'Latitude') return 'latitude';
		// if (header === 'Longitude') return 'longitude';
		// if (header === 'Date') return 'date';
		// if (header === 'Number' || header === 'Numberz') return 'number';
		// if (header === 'Country' || header === 'Text') return 'string';

		// Use the type from columnTypes if available
		return localData.columnTypes[header] || 'string';
	}

	// Format column type for display
	function formatColumnType(type: string): string {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	// Drag event handlers
	function handleDragStart(event: DragEvent, header: string) {
		if (event.dataTransfer) {
			const columnType = getColumnType(header);

			// Use the utility function to setup the column drag
			setupColumnDrag(event, header, columnType, localData.records, formatColumnType);
			draggedHeader = header;

			// Dispatch event to parent component
			dispatch('dragStart', {
				header,
				columnType
			});

			logger.debug(`Drag started for ${header} of type ${columnType}`);
		}
	}

	function handleDragEnd() {
		draggedHeader = null;

		// Dispatch event to parent component
		dispatch('dragEnd');

		logger.debug('Drag ended');
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
			localData = rawData as ValidatedTransformData;
			totalRecords = rawData.records.length; // Store total record count
			dataSource = 'store';
			debug = 'Data successfully loaded from Transform stage';

			// Log data summary information
			if (DEBUG) {
				logger.debug('===== TRANSPLANT DATA VERIFICATION =====');
				logger.debug(`Total Records: ${totalRecords}`);
				logger.debug(`Records Displayed: ${Math.min(maxRowsToShow, totalRecords)}`);
				logger.debug('First 4 Records:', localData.records.slice(0, maxRowsToShow));
				logger.debug('All Records:', localData.records);
				logger.debug('Column Types:', localData.columnTypes);
				logger.debug('=======================================');
			} else {
				// Minimal logging when not in debug mode
				logger.info(`Loaded ${totalRecords} records from transform service`);
			}

			// Create JSON object structure
			let jsonObject: {
				headers: Array<{ header: string; category: string }>;
				data: Array<Record<string, any>>;
			} = {
				headers: [],
				data: []
			};

			// Populate headers
			if (localData.records.length > 0) {
				const firstRecord = localData.records[0];
				jsonObject.headers = Object.keys(firstRecord).map((header) => {
					return {
						header,
						category: getColumnType(header)
					};
				});

				// Populate data (limited to maxRowsToShow for UI)
				jsonObject.data = localData.records.slice(0, maxRowsToShow);

				logger.debug('JSON structure created for UI rendering');
			}
		} else {
			debug = 'No data found. Please go to transform page first.';
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
	{#if localData && localData.records && localData.records.length > 0}
		<table>
			<thead>
				<tr>
					{#each Object.keys(localData.records[0]) as header}
						<th
							draggable="true"
							ondragstart={(e) => handleDragStart(e, header)}
							ondragend={handleDragEnd}
							class={draggedHeader === header ? 'dragging' : ''}
							style={mappedColumns.includes(header)
								? 'color: #777 !important; background-color: #f7f7f7 !important;'
								: ''}
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
				{#each localData.records.slice(0, maxRowsToShow) as record}
					<tr>
						{#each Object.keys(record) as header}
							<td
								draggable="true"
								ondragstart={(e) => handleDragStart(e, header)}
								ondragend={handleDragEnd}
								style={mappedColumns.includes(header)
									? 'color: #777 !important; background-color: #f7f7f7 !important;'
									: ''}>{record[header]}</td
							>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		{#if totalRecords > 0}{/if}
	{:else}
		<p>
			No data available to display. <button onclick={returnToTransform}>Return to Transform</button>
		</p>
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

	/* Hover effect for all cells */
	th:hover,
	td:hover {
		color: #333 !important;
		background-color: #e8f4ff !important;
	}
</style>
