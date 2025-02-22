<script lang="ts">
	import { goto } from '$app/navigation';
	import { canTransform, transformData } from '../utils/transformUtils';
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';
	import {
		formatGpsCoordinate,
		parseGpsCoordinate,
		isValidLatitude,
		isValidLongitude
	} from '../utils/gpsUtils';

	const { onTransform } = $props<{
		onTransform: () => void;
	}>();

	// Store original data immutably
	let originalData = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let invalidCells = $state<Record<string, Set<number>>>({});
	let toggledColumns = $state<Record<string, boolean>>({});

	// Derive headers and transformed data
	let columnHeaders = $derived(originalData.length > 0 ? Object.keys(originalData[0]) : []);
	let transformedData = $derived(formatDataForDisplay(originalData));

	// Check if data is ready for transformation
	let isReadyToTransform = $derived(
		canTransform({
			data: originalData,
			headers: columnHeaders,
			types: columnTypes,
			invalidCells,
			toggledColumns
		})
	);

	async function handleTransform(event?: MouseEvent) {
		console.log('1. Button clicked');

		if (!isReadyToTransform) {
			console.error('Data not ready for transformation');
			return;
		}

		try {
			console.log('2. Storing data:', {
				dataLength: transformedData.length,
				headers: columnHeaders
			});

			// Store the transformed data
			sessionStorage.setItem(
				'transformedData',
				JSON.stringify({
					data: transformedData,
					headers: columnHeaders
				})
			);

			console.log('3. Data stored, navigating to /transplant');
			await goto('/transplant');
			console.log('4. Navigation complete');
		} catch (error) {
			console.error('Error in transform:', error);
		}
	}

	function detectColumnType(header: string, samples: string[]): string {
		console.log(`\nDetecting type for ${header} with ${samples.length} samples`);
		const headerLower = header.toLowerCase();

		// 1. Try GPS (most specific)
		const gpsCount = samples.filter((value) => parseGpsCoordinate(value) !== null).length;
		console.log(`GPS match: ${gpsCount}/${samples.length}`);
		if (gpsCount === samples.length) {
			console.log(`${header}: All values are GPS coordinates`);
			return 'gps';
		}

		// 2. Try Latitude/Longitude
		if (/l.*?a.*?t/i.test(headerLower)) {
			const validLat = samples.every((v) => !isNaN(parseFloat(v)) && Math.abs(parseFloat(v)) <= 90);
			if (validLat) {
				console.log(`${header}: All values are valid latitudes`);
				return 'latitude';
			}
		}
		if (/l.*?o.*?n/i.test(headerLower)) {
			const validLon = samples.every(
				(v) => !isNaN(parseFloat(v)) && Math.abs(parseFloat(v)) <= 180
			);
			if (validLon) {
				console.log(`${header}: All values are valid longitudes`);
				return 'longitude';
			}
		}

		// 3. Try Numbers
		const numCount = samples.filter((value) => isNumber(value)).length;
		if (numCount === samples.length) {
			console.log(`${header}: All values are numbers`);
			return 'number';
		}

		// 4. Default to string (least specific)
		console.log(`${header}: Defaulting to string`);
		return 'string';
	}

	function handleDataLoaded(event: CustomEvent<{ data: Record<string, string>[] }>) {
		// Create a new copy of the data
		originalData = event.detail.data.map((row) => ({ ...row }));

		// Get sample values for each column (first 5 non-empty)
		const samples: Record<string, string[]> = {};
		Object.keys(originalData[0] || {}).forEach((header) => {
			const headerSamples: string[] = [];
			for (const row of originalData) {
				const value = row[header]?.trim();
				if (value) {
					headerSamples.push(value);
					if (headerSamples.length >= 5) break;
				}
			}
			samples[header] = headerSamples;
		});

		// Detect types for each column
		columnTypes = Object.keys(originalData[0] || {}).reduce(
			(types, header) => ({
				...types,
				[header]: detectColumnType(header, samples[header])
			}),
			{}
		);

		// Initial validation
		validateColumns();
	}

	function handleTypeChange(event: CustomEvent<{ columnHeader: string; type: string }>) {
		const { columnHeader, type } = event.detail;
		console.log(`Changing type for ${columnHeader} to ${type}`);

		// Update column type
		columnTypes = { ...columnTypes, [columnHeader]: type };

		// Clear any existing validation state for this column
		if (invalidCells[columnHeader]) {
			const newInvalidCells = { ...invalidCells };
			delete newInvalidCells[columnHeader];
			invalidCells = newInvalidCells;
		}

		// Validate immediately after type change
		validateColumns();
	}

	function isNumber(value: string): boolean {
		if (!value?.trim()) return false;

		// Only allow digits, one decimal point, and one negative sign at start
		const numberRegex = /^-?\d*\.?\d+$/;
		return numberRegex.test(value.trim());
	}

	function formatGps(value: string): string {
		console.log('Formatting GPS value:', value);
		if (!value?.trim()) return value;

		// Try parsing as coordinates
		const coord = parseGpsCoordinate(value);
		console.log('Parsed coordinate:', coord);

		if (coord !== null) {
			const formatted = formatGpsCoordinate(coord);
			console.log('Formatted coordinate:', formatted);
			return formatted;
		}

		// If parsing failed, return original value
		console.log('Returning original value');
		return value;
	}

	function formatDate(value: string): string {
		if (!value?.trim()) return '';

		// If it's a year in range, format as year date
		const num = Number(value);
		if (!isNaN(num) && num >= 1850 && num <= 2035) {
			return `${value}-01-01T00:00:00.000Z`;
		}

		// Otherwise try to format as regular date
		try {
			const date = new Date(value);
			if (!isNaN(date.getTime())) {
				return date.toISOString();
			}
		} catch {
			return value;
		}
		return value;
	}

	function formatNumber(value: string): string {
		if (!value?.trim()) return value;

		// Remove any existing commas first
		const cleanValue = value.replace(/,/g, '');
		const num = Number(cleanValue);

		if (isNaN(num)) return value;

		// Split into whole and decimal parts
		const [whole, decimal] = num.toString().split('.');

		// Add commas to the whole number part
		const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

		// Return with decimal if it exists
		return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
	}

	function isValidForType(value: string, type: string): boolean {
		// Empty cells are always valid
		if (!value?.trim()) return true;

		switch (type) {
			case 'number':
				return isNumber(value.trim());
			case 'date':
				const date = new Date(value);
				return !isNaN(date.getTime());
			case 'gps':
				const coord = parseGpsCoordinate(value);
				return coord !== null;
			case 'string':
				return true;
			default:
				return false;
		}
	}

	function validateColumns() {
		const newInvalidCells: Record<string, Set<number>> = {};

		Object.entries(columnTypes).forEach(([header, type]) => {
			if (type === 'string') return; // String type is always valid

			const invalid = new Set<number>();
			originalData.forEach((row, index) => {
				const value = row[header]?.trim();
				if (!value) return; // Empty values are valid

				let isValid = false;
				switch (type) {
					case 'gps':
						isValid = parseGpsCoordinate(value) !== null;
						break;
					case 'latitude':
						isValid = isValidLatitude(value);
						break;
					case 'longitude':
						isValid = isValidLongitude(value);
						break;
					case 'number':
						isValid = isNumber(value);
						break;
					case 'date':
						isValid = !isNaN(Date.parse(value));
						break;
					default:
						isValid = false;
				}

				if (!isValid) {
					invalid.add(index);
				}
			});

			if (invalid.size > 0) {
				newInvalidCells[header] = invalid;
			}
		});

		invalidCells = newInvalidCells;
	}

	function formatDataForDisplay(data: Record<string, string>[]): Record<string, string>[] {
		return data.map((row, index) => {
			const formattedRow = { ...row };
			Object.entries(columnTypes).forEach(([header, type]) => {
				// Only format if the cell is valid
				if (!invalidCells[header]?.has(index)) {
					const value = row[header]?.trim();
					if (value) {
						switch (type) {
							case 'gps':
								const coord = parseGpsCoordinate(value);
								if (coord) {
									formattedRow[header] = formatGpsCoordinate(coord);
								}
								break;
							// Add other formatting cases as needed
						}
					}
				}
			});
			return formattedRow;
		});
	}

	function isValidType(value: string, type: string): boolean {
		if (!value?.trim()) return true; // Empty values are considered valid
		if (type === 'number') return isNumber(value);
		if (type === 'date') return isValidDateValue(value);
		if (type === 'gps') return parseGpsCoordinate(value) !== null;
		return true; // Default valid for string type
	}

	function isValidDateValue(value: string): boolean {
		// If it's a number, check if it's in the valid year range
		if (isNumber(value)) {
			const num = Number(value.replace(/,/g, ''));
			return num >= 1850 && num <= 2035;
		}

		// If not a number, check if it's a valid date string
		try {
			const date = new Date(value);
			return !isNaN(date.getTime());
		} catch {
			return false;
		}
	}
</script>

<div class="transform-manager">
	<CSVImporter on:dataLoaded={handleDataLoaded} />
	{#if originalData.length > 0}
		<DataPreviewTable
			rows={transformedData}
			{invalidCells}
			{columnTypes}
			{toggledColumns}
			on:typeChange={handleTypeChange}
		/>
		<div class="transform-actions">
			<button class="primary transform-button" onclick={handleTransform} type="button">
				Transform Data
			</button>
		</div>
	{/if}
</div>

<style>
	.transform-manager {
		width: 100%;
	}

	.transform-actions {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}
</style>
