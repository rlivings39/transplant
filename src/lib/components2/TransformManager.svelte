<script lang="ts">
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';

	// Store original data immutably
	let originalData = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let invalidCells = $state<Record<string, Set<number>>>({});

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

	function parseGpsCoordinate(value: string): [number, number] | null {
		const parts = value.split(',');
		if (parts.length !== 2) return null;

		const lat = parseFloat(parts[0]);
		const lon = parseFloat(parts[1]);

		if (isNaN(lat) || isNaN(lon)) return null;

		return [lat, lon];
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
		// Preserve empty or whitespace-only values
		if (!value?.trim()) return '';

		// Remove any existing commas and parse
		const num = Number(value.replace(/,/g, ''));
		if (isNaN(num)) return value;

		// Format with comma-separated thousands, preserving decimal places
		const [whole, decimal] = value.split('.');
		const formattedWhole = Number(whole).toLocaleString('en-US');
		return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
	}

	function formatDataForDisplay(data: Record<string, string>[]): Record<string, string>[] {
		if (!data?.length) return [];

		return data.map((row) => {
			const formattedRow = { ...row };
			Object.keys(row).forEach((header) => {
				const type = columnTypes[header];
				const value = row[header];

				if (type === 'number') {
					formattedRow[header] = formatNumber(value);
				} else if (type === 'date') {
					formattedRow[header] = formatDate(value);
				} else if (type === 'gps') {
					const coord = parseGpsCoordinate(value);
					if (coord) {
						const [lat, lon] = coord;
						formattedRow[header] = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
					}
				}
			});
			return formattedRow;
		});
	}

	function validateColumns() {
		const newInvalidCells: Record<string, Set<number>> = {};

		columnHeaders.forEach((header) => {
			newInvalidCells[header] = new Set();
			originalData.forEach((row, index) => {
				const type = columnTypes[header];
				const value = row[header];

				if (!isValidType(value, type)) {
					newInvalidCells[header].add(index);
				}
			});
		});

		invalidCells = newInvalidCells;
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
			on:typeChange={handleTypeChange}
		/>
	{/if}
</div>
