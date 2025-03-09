<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { goto } from '$app/navigation';

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

			event.dataTransfer.setData('text/plain', header);
			event.dataTransfer.setData(
				'application/json',
				JSON.stringify({
					header,
					columnType
				})
			);
			event.dataTransfer.effectAllowed = 'move';
			draggedHeader = header;

			// Dispatch event to parent component
			dispatch('dragStart', {
				header,
				columnType
			});

			console.log(`Drag started for ${header} of type ${columnType}`);
		}
	}

	function handleDragEnd() {
		draggedHeader = null;

		// Dispatch event to parent component
		dispatch('dragEnd');

		console.log('Drag ended');
	}

	// Load data on component mount
	onMount(() => {
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

			// Enhanced console logs to show detailed information about the data
			console.log('===== TRANSPLANT DATA VERIFICATION =====');
			console.log('Total Records Received from Transform:', totalRecords);
			console.log('Records Being Displayed in UI:', Math.min(maxRowsToShow, totalRecords));
			console.log('First 4 Records (Displayed in UI):', localData.records.slice(0, maxRowsToShow));
			console.log('All Records (Stored in Memory):', localData.records);
			console.log('Column Types:', localData.columnTypes);
			console.log('=======================================');

			// Create JSON object structure
			let jsonObject: {
				headers: Array<{ header: string; category: string }>;
				data: Record<string, any[]>;
			} = {
				headers: [],
				data: {}
			};

			if (localData && localData.records) {
				// Populate the headers
				Object.keys(localData.records[0]).forEach((header) => {
					jsonObject.headers.push({ header: header, category: 'random' }); // Treat as a random attribute
					jsonObject.data[header] = []; // Initialize the array for this header
				});

				// Populate the data
				localData.records.forEach((record) => {
					Object.keys(record).forEach((header) => {
						jsonObject.data[header].push(record[header]); // Push the value into the array
					});
				});

				console.log('JSON Object:', JSON.stringify(jsonObject, null, 2)); // Log the JSON object
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
							>{record[header]}</td>
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
