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
		columnTypes = { ...columnTypes, [event.detail.columnHeader]: event.detail.type };
		validateColumns(); // Re-validate after type change
	}

	function handleDataLoaded(event: CustomEvent<{ data: Record<string, string>[] }>) {
		// Create a new copy of the data to avoid mutating CSVImporter's data
		originalData = event.detail.data.map((row) => ({ ...row }));

		// Initial type detection
		columnTypes = Object.keys(originalData[0] || {}).reduce(
			(types, header) => ({
				...types,
				[header]: detectColumnType(originalData.map((row) => row[header]))
			}),
			{}
		);
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

		// Check if it's a latitude column
		const headerLower = columnHeaders[0].toLowerCase();
		if (headerLower.includes('lat')) {
			const allLat = sample.every((value) => {
				const num = parseFloat(value);
				return !isNaN(num) && Math.abs(num) <= 90;
			});
			if (allLat) return 'gps';
		}

		// Check if it's a longitude column
		if (headerLower.includes('lon')) {
			const allLon = sample.every((value) => {
				const num = parseFloat(value);
				return !isNaN(num) && Math.abs(num) <= 180;
			});
			if (allLon) return 'gps';
		}

		// Check for combined GPS coordinates
		const allGps = sample.every((value) => {
			const coord = parseGpsCoordinate(value);
			return coord !== null;
		});
		if (allGps) return 'gps';

		// First check if all values could be numbers (including comma-separated)
		if (sample.every(isNumber)) {
			// If they're all numbers, check if they're all in date range
			const allInDateRange = sample.every((v) => {
				const num = Number(v.replace(/,/g, ''));
				return num >= 1850 && num <= 2035;
			});

			if (allInDateRange) {
				return 'date'; // All numbers are in date range
			}
			return 'number'; // Some numbers outside date range
		}

		// If not all numbers, check if they're valid dates
		if (
			sample.every((v) => {
				try {
					const date = new Date(v);
					return !isNaN(date.getTime());
				} catch {
					return false;
				}
			})
		) {
			return 'date';
		}

		// If neither numbers nor dates, it's a string
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

		columnHeaders.forEach((header) => {
			const type = columnTypes[header];
			newInvalidCells[header] = new Set();

			originalData.forEach((row, index) => {
				if (!isValidForType(row[header], type)) {
					newInvalidCells[header].add(index);
				}
			});
		});

		invalidCells = newInvalidCells;
	}

	function formatDataForDisplay(data: Record<string, string>[]): Record<string, string>[] {
		if (!data?.length) return [];

		return data.map((row, rowIndex) => {
			const formattedRow: Record<string, string> = {};

			Object.entries(row).forEach(([header, value]) => {
				const type = columnTypes[header];
				let formattedValue = value;

				// Apply formatting based on type
				if (type === 'number') {
					formattedValue = formatNumber(value);
				} else if (type === 'date') {
					formattedValue = formatDate(value);
				} else if (type === 'gps') {
					formattedValue = formatGps(value);
				}

				// Store the formatted value
				formattedRow[header] = formattedValue;
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
	{/if}
</div>
