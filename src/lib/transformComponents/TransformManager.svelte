<script lang="ts">
	import * as dateType from '$lib/utils/dataTypes/dateType';
	import * as numberType from '$lib/utils/dataTypes/numberType';
	import * as gpsType from '$lib/utils/dataTypes/gpsType';
	import { nonBlankValidSampleCount } from '$lib/utils/dataTypes/validationSampleCount';
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';
	import type { CsvPreviewEvent } from '$lib/types/transformTypes';

	// States
	let originalData = $state<Record<string, string>[]>([]);
	let data = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let toggledColumns = $state<Record<string, boolean>>({});
	let invalidCells = $state<Record<string, Set<number>>>({});
	let transformedData = $state<Record<string, string>[]>([]);
	let canTransform = $state(false);

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
		originalData = event.detail.data.map((row) => ({ ...row }));
		data = originalData;
	}

	// Initialize types and validation on data change
	$effect(() => {
		if (!data.length) return;

		const headers = Object.keys(data[0]);
		headers.forEach((header) => {
			if (columnTypes[header]) return; // Skip if type already set

			// Get samples for type detection
			const samples = data
				.map((row) => row[header]?.trim())
				.filter((value) => value)
				.slice(0, nonBlankValidSampleCount);

			// Run through type detection pipeline
			let detectedType: string | null = null;
			for (const { detect } of typeDetectors) {
				detectedType = detect(header, samples);
				if (detectedType) break;
			}

			// Default to string if no type detected
			columnTypes[header] = detectedType || 'string';
		});

		validateAndTransformData();
	});

	// Single-pass validation and transformation
	function validateAndTransformData() {
		const newInvalidCells: Record<string, Set<number>> = {};
		const newTransformedData: Record<string, string>[] = [];

		// Process each row
		data.forEach((row, rowIndex) => {
			const newRow: Record<string, string> = {};

			// Process each column
			for (const [header, type] of Object.entries(columnTypes)) {
				if (type === 'delete' || toggledColumns[header]) continue;

				const value = row[header]?.trim();
				if (!value) continue;

				// Find handler that can convert this value
				const handler = typeDetectors.find(
					(d) => d.handler.validateAndFormat(header, value).isValid
				)?.handler;

				if (handler) {
					const result = handler.validateAndFormat(header, value);

					// Store the converted value
					newRow[header] = result.formattedValue || value;

					// Only mark invalid if no handler could convert it to the right type
					if (result.type !== type) {
						if (!newInvalidCells[header]) newInvalidCells[header] = new Set();
						newInvalidCells[header].add(rowIndex);
					}
				} else {
					// No handler could convert this - mark as invalid
					if (!newInvalidCells[header]) newInvalidCells[header] = new Set();
					newInvalidCells[header].add(rowIndex);
					newRow[header] = value;
				}
			}

			if (Object.keys(newRow).length > 0) {
				newTransformedData.push(newRow);
			}
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

	// ➡️️➡️️➡️️➡️️ final pushToTransplant - push to TRANSPLANT app ➡️️➡️️➡️️
	async function pushToTransplant() {
		if (!canTransform) {
			// // console.error('Data not ready for transformation');
			return;
		}

		try {
			const transformed = getTransformedData();
			sessionStorage.setItem('transformedData', JSON.stringify(transformed));
			await import('$app/navigation').then(({ goto }) => goto('/transplant'));
		} catch (error) {
			// console.error('Error in transform:', error);
		}
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
	{/if}
	<button onclick={pushToTransplant}>Transform</button>
</div>
