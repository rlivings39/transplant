<script lang="ts">
	import * as dateType from '$lib/utils/dataTypes/dateType';
	import * as numberType from '$lib/utils/dataTypes/numberType';
	import * as gpsType from '$lib/utils/dataTypes/gpsType';
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';
	import type { CsvPreviewEvent } from '$lib/types/globalTypes';

	// All the states, in order, raw, columnTypes State
	let originalData = $state<Record<string, string>[]>([]); // original data for undo
	let data = $state<Record<string, string>[]>([]); // Moving data state that gets modified.
	let columnTypes = $state<Record<string, string>>({}); // mapping headers to types
	let toggledColumns = $state<Record<string, boolean>>({}); // tracks toggled off
	let invalidCells = $state<Record<string, Set<number>>>({}); // tracks invalid cells
	let transformedData = $state<Record<string, string>[]>([]); // transformed data for display

	// Available types and their validation/formatting functions
	const types = ['string', 'number', 'date', 'gps', 'latitude', 'longitude', 'delete'] as const;
	type ValidType = (typeof types)[number];

	function csvDataLoad(event: CsvPreviewEvent<'csvLoaded'>) {
		originalData = event.detail.data.map((row) => ({ ...row }));
		data = originalData;
	}

	// Let each type handler validate and format its own data
	function validateAndFormatData(
		header: string,
		value: string
	): {
		type: ValidType;
		isValid: boolean;
		formattedValue: string;
	} {
		// Try GPS types first
		const gpsResult = gpsType.validateAndFormat(header, value);
		if (gpsResult.type) {
			return gpsResult;
		}

		// Try date
		const dateResult = dateType.validateAndFormat(header, value);
		if (dateResult.type) {
			return dateResult;
		}

		// Try number
		const numberResult = numberType.validateAndFormat(header, value);
		if (numberResult.type) {
			return numberResult;
		}

		// Default to string
		return {
			type: 'string',
			isValid: true,
			formattedValue: value
		};
	}

	// Column validation
	function validateColumns() {
		const newInvalidCells: Record<string, Set<number>> = {};

		for (const [header, type] of Object.entries(columnTypes)) {
			if (type === 'delete' || toggledColumns[header]) continue;

			const invalidSet = new Set<number>();
			data.forEach((row, index) => {
				const value = row[header]?.trim();
				if (!value) return;

				const result = validateAndFormatData(header, value);
				if (!result.isValid) {
					invalidSet.add(index);
				}
			});

			if (invalidSet.size > 0) {
				newInvalidCells[header] = invalidSet;
			}
		}

		invalidCells = newInvalidCells;
	}

	// Handle type changes
	function handleTypeChange(event: CsvPreviewEvent<'typeChange'>) {
		const { columnHeader, type } = event.detail;
		columnTypes = { ...columnTypes, [columnHeader]: type };
		validateColumns();
		transformedData = formatDataForDisplay();
	}

	function handleColumnToggle(header: string, isActive: boolean) {
		toggledColumns = { ...toggledColumns, [header]: !isActive };
		validateColumns();
		transformedData = formatDataForDisplay();
	}

	// Initialize types and validation on data change
	$effect(() => {
		if (!data.length) return;

		// Detect types for new columns
		const headers = Object.keys(data[0]);
		headers.forEach((header) => {
			if (columnTypes[header]) return; // Skip if type already set

			// Get first 5 non-empty values for this column
			const samples = data
				.map((row) => row[header]?.trim())
				.filter((value) => value) // Remove empty/null values
				.slice(0, 5);

			// Try each type detector
			if (gpsType.detect(samples)) {
				columnTypes[header] = 'gps';
			} else if (dateType.detect(samples)) {
				columnTypes[header] = 'date';
			} else if (numberType.detect(samples)) {
				columnTypes[header] = 'number';
			} else {
				columnTypes[header] = 'string';
			}
		});

		validateColumns();
		transformedData = formatDataForDisplay();
	});

	function changeDataType() {
		// Filter out deleted and toggled-off columns
		const headers = Object.keys(data[0]);
		const validHeaders = headers.filter(
			(header) => columnTypes[header] !== 'delete' && !toggledColumns[header]
		);

		// Create transformed dataset
		const transformedDataset = data
			.map((row, index) => {
				const newRow: Record<string, any> = {};

				for (const header of validHeaders) {
					// Skip if cell is invalid
					if (invalidCells[header]?.has(index)) continue;

					const value = row[header]?.trim();
					if (!value) continue;

					const result = validateAndFormatData(header, value);
					newRow[header] = result.formattedValue;
				}
				return newRow;
			})
			.filter((row) => Object.keys(row).length > 0);

		return {
			data: transformedDataset,
			headers: validHeaders,
			types: columnTypes
		};
	}

	//  📺️📺️📺️📺️  display DataPreviewTable 📺️📺️📺️
	function formatDataForDisplay(): Record<string, string>[] {
		return data.map((row) => {
			const formattedRow: Record<string, string> = {};
			for (const [key, value] of Object.entries(row)) {
				if (toggledColumns[key] || !value?.trim()) {
					formattedRow[key] = value;
					continue;
				}

				// Get formatted value from type handlers
				const result = validateAndFormatData(key, value);
				formattedRow[key] = result.formattedValue;
			}
			return formattedRow;
		});
	}

	// ➡️️➡️️➡️️➡️️➡️️ final pushToTransplant - push to TRANSPLANT app ➡️️➡️️➡️️
	async function pushToTransplant() {
		if (!canTransform()) {
			console.error('Data not ready for transformation');
			return;
		}

		try {
			const transformed = changeDataType();
			sessionStorage.setItem('transformedData', JSON.stringify(transformed));
			await import('$app/navigation').then(({ goto }) => goto('/transplant'));
		} catch (error) {
			console.error('Error in transform:', error);
		}
	}
</script>

<div class="transform-manager">
	<!-- {@const debug = console.log('Rendering TransformManager, data length:', data.length)} -->
	<CSVImporter on:dataLoaded={csvDataLoad} />
	{#if data.length}
		<DataPreviewTable
			rows={transformedData}
			{invalidCells}
			{columnTypes}
			on:typeChange={handleTypeChange}
			on:columnToggle={handleColumnToggle}
		/>
	{/if}
	<button onclick={pushToTransplant}>Transform</button>
</div>
