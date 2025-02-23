<script lang="ts">
	import * as dateType from '$lib/utils/dataTypes/dateType';
	import * as numberType from '$lib/utils/dataTypes/numberType';
	import * as gpsType from '$lib/utils/dataTypes/gpsType';
	// import { $state, $derived, $effect } from 'svelte/runes';
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';

	// State
	let data = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let toggledColumns = $state<Record<string, boolean>>({});
	let invalidCells = $state<Record<string, Set<number>>>({});
	let transformedData = $state<Record<string, string>[]>([]);
	let originalData = $state<Record<string, string>[]>([]);

	// Available types and their validation/formatting functions
	const types = ['string', 'number', 'date', 'gps', 'latitude', 'longitude', 'delete'] as const;
	type ValidType = (typeof types)[number];

	const typeHandlers = {
		date: dateType,
		number: numberType,
		gps: gpsType,
		latitude: gpsType.latitudeHandler,
		longitude: gpsType.longitudeHandler,
		string: {
			validate: () => true,
			format: (value: string) => value,
			detect: () => true
		}
	} as const;

	// Validation and formatting
	function validate(value: string, type: ValidType): boolean {
		if (!value?.trim()) return true;
		return typeHandlers[type]?.validate(value) ?? false;
	}

	function format(value: string, type: ValidType): string {
		if (!value?.trim() || type === 'delete') return value;
		return typeHandlers[type]?.format(value) ?? value;
	}

	// Type detection - tries each type in priority order
	function detectColumnType(header: string): ValidType {
		if (!data.length) return 'string';

		const samples = data.map((row) => row[header]?.trim());

		// Let each type handler decide if it matches
		const coordType = gpsType.detectCoordinateType(header, samples);
		if (coordType) return coordType;

		// Try other types in priority order
		const detectionOrder: ValidType[] = ['gps', 'date', 'number', 'string'];
		for (const type of detectionOrder) {
			if (typeHandlers[type]?.detect(samples, header)) {
				return type;
			}
		}

		return 'string';
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

				if (!validate(value, type as ValidType)) {
					invalidSet.add(index);
				}
			});

			if (invalidSet.size > 0) {
				newInvalidCells[header] = invalidSet;
			}
		}

		invalidCells = newInvalidCells;
	}

	// Format data for display
	function formatDataForDisplay(): Record<string, string>[] {
		return data.map((row) => {
			const formattedRow: Record<string, string> = {};
			for (const [key, value] of Object.entries(row)) {
				if (toggledColumns[key] || !value?.trim()) {
					formattedRow[key] = value;
					continue;
				}
				formattedRow[key] = format(value, columnTypes[key] as ValidType);
			}
			return formattedRow;
		});
	}

	// Handle type changes
	function handleTypeChange(event: CustomEvent<{ columnHeader: string; type: string }>) {
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
			if (!columnTypes[header]) {
				columnTypes[header] = detectColumnType(header);
			}
		});

		validateColumns();
		transformedData = formatDataForDisplay();
	});

	function canTransform(): boolean {
		// Check if we have data
		if (data.length === 0) return false;

		// Check if all columns have valid types
		const hasValidTypes = Object.entries(columnTypes).every(([header, type]) => {
			return type !== 'delete' && !toggledColumns[header];
		});

		// Check if all visible data is valid
		const hasValidData = Object.entries(invalidCells).every(([header, invalid]) => {
			return toggledColumns[header] || invalid.size === 0;
		});

		return hasValidTypes && hasValidData;
	}

	function transformData() {
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

					// Transform value based on type
					switch (columnTypes[header]) {
						case 'number':
							newRow[header] = Number(value.replace(/,/g, ''));
							break;
						case 'date':
							newRow[header] = new Date(value).toISOString();
							break;
						case 'gps':
							const coord = gpsType.parseGpsCoordinate(value);
							if (coord) newRow[header] = gpsType.format(value);
							break;
						case 'latitude':
							newRow[header] = parseFloat(value);
							break;
						case 'longitude':
							newRow[header] = parseFloat(value);
							break;
						default:
							newRow[header] = value;
					}
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

	async function handleTransform() {
		if (!canTransform()) {
			console.error('Data not ready for transformation');
			return;
		}

		try {
			const transformed = transformData();
			sessionStorage.setItem('transformedData', JSON.stringify(transformed));
			await import('$app/navigation').then(({ goto }) => goto('/transplant'));
		} catch (error) {
			console.error('Error in transform:', error);
		}
	}

	function handleDataLoaded(event: CustomEvent<{ data: Record<string, string>[] }>) {
		originalData = event.detail.data.map((row) => ({ ...row }));
		data = originalData;
	}
</script>

<div class="transform-manager">
	<CSVImporter on:dataLoaded={handleDataLoaded} />
	{#if data.length}
		<DataPreviewTable
			rows={transformedData}
			{invalidCells}
			{columnTypes}
			on:typeChange={handleTypeChange}
			on:columnToggle={handleColumnToggle}
		/>
	{/if}
	<button onclick={handleTransform}>Transform</button>
</div>
