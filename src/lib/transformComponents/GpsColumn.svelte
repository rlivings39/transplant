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

	function calculateGpsValue(): string {
		try {
			// Get all GPS-type columns
			const gpsColumns = columnHeaders.filter((header: string) => columnTypes[header] === 'gps');
			const allGpsToggledOff =
				gpsColumns.length > 0 && gpsColumns.every((header: string) => toggledColumns[header]);

			// Get active columns considering override condition
			const activeColumns = columnHeaders.filter((header: string) => {
				const isInvalid = invalidCells?.[header]?.has(rowIndex) ?? false;
				const isToggled = toggledColumns[header];
				const isGpsType = columnTypes[header] === 'gps';

				// Override toggle if all GPS columns are off and this is a GPS column
				const overrideToggle = allGpsToggledOff && isGpsType;

				return !isInvalid && (overrideToggle || !isToggled) && row[header]?.trim();
			});

			// First try GPS-type columns
			for (const header of activeColumns) {
				if (columnTypes[header] === 'gps' && row[header]) {
					const gpsValue = parseGpsCoordinate(row[header]);
					if (gpsValue) {
						return row[header].trim();
					}
				}
			}

			// Then try lat/lon pairs (only if not all GPS columns are toggled off)
			if (!allGpsToggledOff) {
				const latColumns = activeColumns.filter(
					(header: string) => detectCoordinateType(header, row[header]) === 'latitude'
				);
				const lonColumns = activeColumns.filter(
					(header: string) => detectCoordinateType(header, row[header]) === 'longitude'
				);

				for (const latCol of latColumns) {
					const lat = row[latCol]?.trim();
					if (!lat) continue;

					for (const lonCol of lonColumns) {
						const lon = row[lonCol]?.trim();
						if (!lon) continue;

						const coordPair = `${lat}, ${lon}`;
						if (parseGpsCoordinate(coordPair)) {
							return coordPair;
						}
					}
				}
			}
		} catch (error) {
			console.error('Error in GPS calculation:', error);
		}
		return '';
	}

	// Execute the function in the derived statement
	const displayValue = $derived(calculateGpsValue());
</script>

<td class="gps-column">
	{displayValue}
</td>
