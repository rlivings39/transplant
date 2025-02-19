<script lang="ts">
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';

	let transformedData = $state<Record<string, any>[]>([]);
	let invalidCells = $state<Record<string, Set<number>>>({});
	let columnTypes = $state<Record<string, string>>({});

	let columnHeaders = $derived(transformedData.length > 0 ? Object.keys(transformedData[0]) : []);

	function handleTypeChange(event: CustomEvent<{ columnHeader: string; type: string }>) {
		columnTypes = { ...columnTypes, [event.detail.columnHeader]: event.detail.type };
		validateColumns(); // Re-validate after type change
	}

	function handleDataLoaded(event: CustomEvent<{ data: Record<string, string>[] }>) {
		transformedData = event.detail.data;
		// Initial type detection
		columnTypes = Object.keys(transformedData[0]).reduce(
			(types, header) => ({
				...types,
				[header]: detectColumnType(transformedData.map((row) => row[header]))
			}),
			{}
		);
		validateColumns(); // Validate after setting initial types
	}

	function isNumber(value: string): boolean {
		// Remove commas and try to parse
		const cleanValue = value.replace(/,/g, '');
		return !isNaN(Number(cleanValue));
	}

	function detectColumnType(values: string[]): string {
		const sample = values.slice(0, 5).filter(Boolean);

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

	function formatDate(value: string): string {
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
		if (!value.trim()) return '';

		// Remove any existing commas and parse
		const num = Number(value.replace(/,/g, ''));
		if (isNaN(num)) return value;

		// Format with comma-separated thousands
		return num.toLocaleString('en-US');
	}

	function cleanValue(value: string): string {
		// Trim and basic normalization
		return value
			.trim()
			.replace(/\s+/g, ' ')
			.replace(/[\u2018\u2019]/g, "'") // Curly quotes
			.replace(/[\u201C\u201D]/g, '"');
	}

	function cleanData(rows: Record<string, string>[]) {
		return rows.map((row) =>
			Object.fromEntries(Object.entries(row).map(([key, val]) => [key, cleanValue(val)]))
		);
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

	function isValidType(value: string, type: string): boolean {
		if (!value.trim()) return true; // Empty values are considered valid
		if (type === 'number') return isNumber(value);
		if (type === 'date') return isValidDateValue(value);
		return true; // Default valid for string type
	}

	function validateColumns() {
		invalidCells = {};
		columnHeaders.forEach((header) => {
			invalidCells[header] = new Set();
			transformedData.forEach((row, index) => {
				const type = columnTypes[header];
				const currentValue = row[header];

				// 5. Format according to selected type
				if (type === 'number') {
					if (typeof currentValue === 'string' && currentValue.includes('T')) {
						// Convert from date format back to number
						const originalNumber = currentValue.split('T')[0].split('-')[0];
						if (!isNaN(Number(originalNumber))) {
							row[header] = formatNumber(originalNumber);
						}
					} else {
						// Format regular numbers
						row[header] = formatNumber(currentValue);
					}
				} else if (type === 'date') {
					row[header] = formatDate(row[header]);
				}

				// Mark invalid cells
				if (!isValidType(row[header], type)) {
					invalidCells[header].add(index);
				}
			});
		});
	}
</script>

<div class="transform-manager">
	<CSVImporter on:dataLoaded={handleDataLoaded} />
	{#if transformedData.length > 0}
		<DataPreviewTable
			rows={transformedData}
			{invalidCells}
			{columnTypes}
			on:typeChange={handleTypeChange}
		/>
	{/if}
</div>
