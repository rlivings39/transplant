<script lang="ts">
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';
	import { formatGpsCoordinate, parseGpsCoordinate } from '../utils/gpsUtils';

	// Store original data immutably
	let originalData = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let invalidCells = $state<Record<string, Set<number>>>({});
	let toggledColumns = $state<Record<string, boolean>>({});

	// Derive headers and transformed data
	let columnHeaders = $derived(originalData.length > 0 ? Object.keys(originalData[0]) : []);
	let transformedData = $derived(formatDataForDisplay(originalData));

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

	function handleDataLoaded(event: CustomEvent<{ data: Record<string, string>[] }>) {
		// Create a new copy of the data
		originalData = event.detail.data.map((row) => ({ ...row }));

		// Start all columns as string type
		columnTypes = Object.keys(originalData[0] || {}).reduce(
			(types, header) => ({
				...types,
				[header]: 'string'
			}),
			{}
		);

		// Initial validation
		validateColumns();
	}

	function isNumber(value: string): boolean {
		if (!value?.trim()) return false;
		// Remove commas and try to parse
		const cleanValue = value.replace(/,/g, '');
		return !isNaN(Number(cleanValue));
	}

	function detectColumnType(values: string[]): string {
		const sample = values.slice(0, 5).filter(Boolean);
		if (sample.length === 0) return 'string';

		// Check header for lat/lon first
		const header = columnHeaders[0].toLowerCase();
		if (/l.*?a.*?t/i.test(header)) {
			return 'latitude';
		} else if (/l.*?o.*?n/i.test(header)) {
			return 'longitude';
		}

		// Check if all values are valid numbers
		if (sample.every(isNumber)) {
			return 'number';
		}

		return 'string';
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
				const cleanValue = value.replace(/,/g, '');
				return !isNaN(Number(cleanValue));
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
						const lat = parseFloat(value);
						isValid = !isNaN(lat) && Math.abs(lat) <= 90;
						break;
					case 'longitude':
						const lon = parseFloat(value);
						isValid = !isNaN(lon) && Math.abs(lon) <= 180;
						break;
					case 'number':
						isValid = !isNaN(parseFloat(value));
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

	function isValidLatitude(value: string): boolean {
		// Implement latitude validation logic here
		return true;
	}

	function isValidLongitude(value: string): boolean {
		// Implement longitude validation logic here
		return true;
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
	{/if}
</div>
