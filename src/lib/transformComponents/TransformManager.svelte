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
	export let toggledColumns = $state<Record<string, boolean>>({});
	let invalidCells = $state<Record<string, Set<number>>>({});
	let transformedData = $state<Record<string, string>[]>([]);
	let canTransform = $state(false);

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
		console.log('exportToTransplant called');
		console.log('transformedData length:', transformedData.length);
		console.log('toggledColumns:', toggledColumns);

		if (transformedData.length === 0) {
			console.error('No transformed data available to export');
			return null;
		}

		// Filter out toggled-off columns from the data
		const filteredRecords = transformedData.map((row) => {
			const filteredRow = {};
			Object.entries(row).forEach(([header, value]) => {
				// Only include columns that are not toggled off
				if (!toggledColumns[header]) {
					filteredRow[header] = value;
				}
			});
			return filteredRow;
		});

		// Also filter column types to match
		const filteredColumnTypes = {};
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

		// Store in the service for TransPlant to access
		transformedDataService.set(exportData);

		console.log('Exporting filtered data to TransPlant:', exportData);
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
