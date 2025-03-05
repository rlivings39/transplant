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
	}>();

	// States
	let originalData = $state<Record<string, string>[]>([]);
	let data = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let toggledColumns = $state<Record<string, boolean>>({});
	let invalidCells = $state<Record<string, Set<number>>>({});
	let transformedData = $state<Record<string, string>[]>([]);
	let canTransform = $state(false);

	interface TransformedData {
		records: Array<Record<string, any>>;
		columnTypes: Record<string, string>;
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
		if (!data.length) return;

		const headers = Object.keys(data[0]);
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

				columnTypes[header] = detectedType || 'string'; // Set type once
			}
		});

		validateAndTransformData();
	});

	// Single-pass validation and transformation
	function validateAndTransformData() {
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

				// // // console.log(`Processing ${header} (type: ${type}) value: ${value}`);

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

				// Unknown type
				// console.warn(`Unknown type: ${type}`);
				if (!newInvalidCells[header]) newInvalidCells[header] = new Set();
				newInvalidCells[header].add(rowIndex);
				newRow[header] = value;
			}

			return newRow;
		});

		invalidCells = newInvalidCells;
		transformedData = newTransformedData;
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

	// Get final transformed data for export
	function getTransformedData() {
		return {
			data: transformedData,
			headers: Object.keys(data[0]).filter(
				(header) => columnTypes[header] !== 'delete' && !toggledColumns[header]
			),
			types: columnTypes
		};
	}

	// SIMPLE function to create a clean copy of the data and save to store
	function handleTransformClick() {
		if (!canTransform) {
			console.warn('Cannot transform - data not ready');
			return;
		}

		// // // console.log('Creating clean copy of transformed data');

		// Get only visible columns (not toggled off)
		const visibleHeaders = Object.keys(data[0]).filter((header) => !toggledColumns[header]);
		// // // console.log('Visible headers:', visibleHeaders);

		// Create clean data (only visible columns, no invalid cells)
		const cleanData = data.map((row, rowIndex) => {
			const cleanRow = {};
			visibleHeaders.forEach((header) => {
				// Skip if invalid
				if (invalidCells[header]?.has(rowIndex)) {
					// // // console.log(`Skipping invalid cell: ${header} at row ${rowIndex}`);
					return;
				}

				// Add to clean row
				cleanRow[header] = row[header];
			});
			return cleanRow;
		});

		// Create a copy with only the needed information
		const transformedCopy = {
			records: cleanData,
			columnTypes: { ...columnTypes } // Include column types
		};

		// Save to transformed data service
		transformedDataService.set(transformedCopy);

		// Dispatch event with transformed data
		dispatch('dataTransformed', transformedCopy);

		// Navigate to transplant page
		// // // console.log('Navigating to transplant page...');
		goto('/transplant');
	}

	// ➡️️➡️️➡️️➡️️ final pushToTransplant - push to TRANSPLANT app ➡️️➡️️➡️️
	function pushToTransplant() {
		if (!canTransform) {
			console.warn('Cannot transform - data not ready');
			return;
		}

		try {
			const validatedData = getValidatedData();
			// // // console.log('Pushing validated data to TransPlant:', validatedData);
			transformedDataService.set(validatedData);

			// Dispatch event with transformed data
			dispatch('dataTransformed', validatedData);

			goto('/transplant');
		} catch (error) {
			// console.error('Error in transform:', error);
		}
	}

	// Check if a value is valid for a given type
	function isValidForType(value: string, type: string): boolean {
		// Skip validation for blank cells
		if (!value || !value.trim()) return true;

		// String type accepts everything
		if (type === 'string') return true;

		// For GPS types
		if (type === 'gps' || type === 'latitude' || type === 'longitude') {
			const result = gpsType.validateAndFormat('', value);
			return result.isValid && result.type === type;
		}

		// For date type
		if (type === 'date') {
			const result = dateType.validateAndFormat('', value);
			return result.isValid && result.type === 'date';
		}

		// For number type
		if (type === 'number') {
			const result = numberType.validateAndFormat('', value);
			return result.isValid && result.type === 'number';
		}

		// Unknown type
		return false;
	}

	function getValidatedData(): TransformedData {
		// Get only visible columns (not toggled off)
		const visibleHeaders = Object.keys(data[0] || {}).filter((header) => !toggledColumns[header]);
		// // // console.log('Visible headers for validation:', visibleHeaders);

		// Create clean data (only visible columns, no invalid cells)
		const validRecords = transformedData.map((row, rowIndex) => {
			const validRow: Record<string, any> = {};

			visibleHeaders.forEach((header) => {
				// Skip if invalid
				if (invalidCells[header]?.has(rowIndex)) {
					// // // console.log(`Skipping invalid cell: ${header} at row ${rowIndex}`);
					return;
				}

				// Add to valid row
				validRow[header] = row[header];
			});

			return validRow;
		});

		// Create a copy with only the needed information
		return {
			records: validRecords,
			columnTypes: Object.fromEntries(visibleHeaders.map((header) => [header, columnTypes[header]]))
		};
	}
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
	<!-- 	
	<button onclick={handleTransformClick} disabled={!canTransform}>
		Transform {!canTransform ? '(Upload CSV first)' : ''}
	</button>

	//  Fallback debug button - this will log data to console
	<button
		onclick={() => {
			// // // console.log('DEBUG: Dumping current data');
			// // // console.log('Data:', data);
			// // // console.log('Column Types:', columnTypes);

			// Create and save data directly
			const cleanData = data.map((row) => {
				const newRow = {};
				Object.keys(row).forEach((key) => {
					newRow[key] = row[key];
				});
				return newRow;
			});

			// Save to transformed data service
			transformedDataService.set({
				records: cleanData,
				columnTypes: { ...columnTypes }
			});

			// // // console.log('Data saved to transformed data service');
			// // // console.log('Now navigate to /transplant to see data');
		}}>Debug: Save Data</button
	>
-->
</div>
