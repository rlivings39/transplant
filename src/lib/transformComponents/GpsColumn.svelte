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

	function getGpsValue(): string {
		// Get all GPS-type columns with explicit string type
		const gpsColumns = columnHeaders.filter((header: string) => columnTypes[header] === 'gps');
		const allGpsToggledOff =
			gpsColumns.length > 0 && gpsColumns.every((header: string) => toggledColumns[header]);

		// Explicitly type the filter callback parameter
		const activeColumns = columnHeaders.filter((header: string) => {
			const isInvalid = invalidCells?.[header]?.has(rowIndex) ?? false;
			const isToggled = toggledColumns[header];
			const isGpsType = columnTypes[header] === 'gps';

			const overrideToggle = allGpsToggledOff && isGpsType;
			return !isInvalid && (overrideToggle || !isToggled) && row[header]?.trim();
		});

		// First try GPS-type columns
		for (const header of activeColumns) {
			if (columnTypes[header] === 'gps' && parseGpsCoordinate(row[header])) {
				return row[header].trim();
			}
		}

		// Then try lat/lon pairs (only if not all GPS columns are toggled off)
		if (!allGpsToggledOff) {
			// Explicitly type filter callbacks
			const latColumns = activeColumns.filter(
				(header: string) => detectCoordinateType(header, row[header]) === 'latitude'
			);
			const lonColumns = activeColumns.filter(
				(header: string) => detectCoordinateType(header, row[header]) === 'longitude'
			);

			// Type the loop variables
			for (const latCol of latColumns) {
				const lat = row[latCol].trim();
				for (const lonCol of lonColumns) {
					const lon = row[lonCol].trim();
					if (parseGpsCoordinate(`${lat}, ${lon}`)) {
						return `${lat}, ${lon}`;
					}
				}
			}
		}
		return '';
	}

	let displayValue = $derived(getGpsValue());
</script>

<td class="gps-column">
	{displayValue}
</td>
