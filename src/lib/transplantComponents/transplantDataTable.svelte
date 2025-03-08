<script lang="ts">
	import { onMount } from 'svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { goto } from '$app/navigation';

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

	// Drag event handlers
	function handleDragStart(event: DragEvent, header: string) {
		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', header);
			event.dataTransfer.effectAllowed = 'move';
			draggedHeader = header;
		}
	}

	function handleDragEnd() {
		draggedHeader = null;
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
									data-type={header === 'GPS' ||
									header === 'GPS examples' ||
									header === 'GPS DO' ||
									header === 'GPS DNS' ||
									header === 'GPS DNS_1'
										? 'Gps'
										: header === 'Latitude'
											? 'Latitude'
											: header === 'Longitude'
												? 'Longitude'
												: header === 'Date'
													? 'Date'
													: header === 'Number' || header === 'Numberz'
														? 'Number'
														: header === 'Country' || header === 'Text'
															? 'String'
															: localData.columnTypes && localData.columnTypes[header]
																? localData.columnTypes[header].charAt(0).toUpperCase() +
																	localData.columnTypes[header].slice(1)
																: 'String'}
								>
									{header === 'GPS' ||
									header === 'GPS examples' ||
									header === 'GPS DO' ||
									header === 'GPS DNS' ||
									header === 'GPS DNS_1'
										? 'Gps'
										: header === 'Latitude'
											? 'Latitude'
											: header === 'Longitude'
												? 'Longitude'
												: header === 'Date'
													? 'Date'
													: header === 'Number' || header === 'Numberz'
														? 'Number'
														: header === 'Country' || header === 'Text'
															? 'String'
															: localData.columnTypes && localData.columnTypes[header]
																? localData.columnTypes[header].charAt(0).toUpperCase() +
																	localData.columnTypes[header].slice(1)
																: 'String'}
								</span>
								<span class="header-text">{header}</span>
								<span class="drag-handle">⇅</span>
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each localData.records.slice(0, maxRowsToShow) as record}
					<tr>
						{#each Object.keys(record) as header}
							<td>{record[header]}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		{#if totalRecords > 0}
			<div class="record-count-info">
				<p>Showing {Math.min(maxRowsToShow, totalRecords)} records out of {totalRecords}</p>
			</div>
		{/if}
	{:else}
		<p>
			No data available to display. <button onclick={returnToTransform}>Return to Transform</button>
		</p>
	{/if}
</div>

<!-- Data summary can be uncommented if needed -->
<!-- {#if localData && localData.records}
	<div class="data-summary">
		<h3>Data Summary</h3>
		<p>Total records: {localData.records.length}</p>
	</div>
{/if} -->

<!-- <style>
	.record-count-info {
		font-size: 0.8rem;
		color: var(--color-light-grey);
		text-align: right;
		padding: 0.5rem;
	}

	th {
		position: relative;
		cursor: grab;
	}

	th.dragging {
		opacity: 0.7;
		background-color: #f0f0f0;
	}

	.drag-handle {
		position: absolute;
		right: 5px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.8rem;
		color: #888;
	}

	.header-text {
		margin-right: 15px;
	}
</style> -->
