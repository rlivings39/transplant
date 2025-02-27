<script lang="ts">
	import { parseGpsCoordinate, detectCoordinateType } from '$lib/utils/dataTypes/gpsType';

	const { row, columnHeaders, columnTypes, toggledColumns, invalidCells, rowIndex } = $props<{
		row: Record<string, string>;
		columnHeaders: string[];
		columnTypes: Record<string, string>;
		toggledColumns: Record<string, boolean>;
		invalidCells: Record<string, Set<number>>;
		rowIndex: number;
	}>();

	function isValidCell(header: string): boolean {
		const isInvalid = invalidCells?.[header]?.has(rowIndex) ?? false;
		const isToggled = toggledColumns[header];
		return !isInvalid && !isToggled;
	}

	function getGpsValue(): string {
		// Only consider non-greyed out columns (valid and not toggled off)
		const activeColumns = columnHeaders.filter(
			(header: string) => isValidCell(header) && row[header]?.trim()
		);

		// First try columns already validated as GPS type
		for (const header of activeColumns) {
			if (columnTypes[header] === 'gps' && parseGpsCoordinate(row[header])) {
				return row[header].trim();
			}
		}

		// Then try latitude/longitude pairs
		const latColumns = activeColumns.filter(
			(header: string) => detectCoordinateType(header, row[header]) === 'latitude'
		);
		const lonColumns = activeColumns.filter(
			(header: string) => detectCoordinateType(header, row[header]) === 'longitude'
		);

		// Return first valid lat/lon pair
		for (const latCol of latColumns) {
			const lat = row[latCol].trim();
			for (const lonCol of lonColumns) {
				const lon = row[lonCol].trim();
				if (parseGpsCoordinate(`${lat}, ${lon}`)) {
					return `${lat}, ${lon}`;
				}
			}
		}

		return '';
	}

	let displayValue = $derived(getGpsValue);
</script>

<td class="gps-column" class:invalid={!displayValue}>
	{displayValue}
</td>
