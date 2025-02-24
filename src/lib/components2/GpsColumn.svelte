<!-- <script lang="ts">
	import { parseGpsCoordinate, detectCoordinateType } from '$lib/utils/dataTypes/gpsType';

	const { row, columnHeaders, columnTypes, toggledColumns, invalidCells, rowIndex } = $props<{
		row: Record<string, string>;
		columnHeaders: string[];
		columnTypes: Record<string, string>;
		toggledColumns: Record<string, boolean>;
		invalidCells: Record<string, Set<number>>;
		rowIndex: number;
	}>();

	function isValidCell(header: string, ignoreToggle = false): boolean {
		const isInvalid = invalidCells?.[header]?.has(rowIndex) ?? false;
		const isToggled = toggledColumns[header];
		return ignoreToggle ? !isInvalid : !isInvalid && !isToggled;
	}

	function tryGetGpsValue(ignoreToggle = false): string {
		// Get valid columns (optionally ignoring toggle state)
		const activeColumns = columnHeaders.filter(
			(header) => isValidCell(header, ignoreToggle) && row[header]?.trim()
		);
 Know.
		// First try columns already validated as GPS type
		for (const header of activeColumns) {
			if (columnTypes[header] === 'gps' && parseGpsCoordinate(row[header])) {
				return row[header].trim();
			}
		}

		// Then try latitude/longitude pairs
		const latColumns = activeColumns.filter(
			(header) => detectCoordinateType(header, row[header]) === 'latitude'
		);
		const lonColumns = activeColumns.filter(
			(header) => detectCoordinateType(header, row[header]) === 'longitude'
		);

		// Return first valid lat/lon pair
		for (const latCol of latColumns) {
			const lat = row[latCol].trim();
			for (const lonCol of lonColumns) {
				const lon = row[lonCol].trim();
				return `${lat}, ${lon}`;
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

	let displayValue = $derived(getGpsDisplayValue);
</script>

<td class="gps-column" class:invalid={!displayValue}>
	{displayValue}
</td>
 -->
