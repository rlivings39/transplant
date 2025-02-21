<script lang="ts">
	import { parseGpsCoordinate } from '$lib/utils/gpsUtils';

	const { row, columnHeaders, columnTypes, toggledColumns, invalidCells, rowIndex } = $props<{
		row: Record<string, string>;
		columnHeaders: string[];
		columnTypes: Record<string, string>;
		toggledColumns: Record<string, boolean>;
		invalidCells: Record<string, Set<number>>;
		rowIndex: number;
	}>();

	function isValidCell(header: string, ignoreToggle = false): boolean {
		const isValid = !(invalidCells?.[header]?.has(rowIndex) ?? false);
		return ignoreToggle ? isValid : isValid && !toggledColumns[header];
	}

	function isValidGpsValue(value: string): boolean {
		const result = parseGpsCoordinate(value);
		return result !== null;
	}

	function tryGetGpsValue(ignoreToggle = false): string {
		// Get valid columns (optionally ignoring toggle state)
		const activeColumns = columnHeaders.filter(
			(header) => isValidCell(header, ignoreToggle) && row[header]?.trim()
		);

		// First try columns already validated as GPS type
		for (const header of activeColumns) {
			if (columnTypes[header] === 'gps' && isValidGpsValue(row[header])) {
				return row[header].trim();
			}
		}

		// Then try any column that contains valid GPS data
		for (const header of activeColumns) {
			const value = row[header].trim();
			if (isValidGpsValue(value)) {
				return value;
			}
		}

		// Then try latitude/longitude pairs
		const latColumns = activeColumns.filter((header) => columnTypes[header] === 'latitude');
		const lonColumns = activeColumns.filter((header) => columnTypes[header] === 'longitude');

		for (const latCol of latColumns) {
			const lat = row[latCol].trim();
			for (const lonCol of lonColumns) {
				const lon = row[lonCol].trim();
				if (isValidGpsValue(`${lat}, ${lon}`)) {
					return `${lat}, ${lon}`;
				}
			}
		}

		return '';
	}

	function getGpsDisplayValue(): string {
		// First try with toggle rules enforced
		const value = tryGetGpsValue(false);
		if (value) return value;

		// If nothing found, try again ignoring toggle state
		return tryGetGpsValue(true);
	}

	let displayValue = $derived(getGpsDisplayValue());
</script>

<td class="gps-column" class:invalid={!displayValue}>
	{displayValue}
</td>

<style>
	.gps-column {
		font-family: monospace;
		width: 12.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 0.25rem 0.5rem;
	}
	.invalid {
		color: var(--text-disabled);
		font-style: italic;
	}
</style>
