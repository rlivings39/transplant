<script lang="ts">
	import { parseGpsCoordinate } from '$lib/utils/dataTypes/gpsType';

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
			// Get active columns that are not invalid or toggled off
			const activeColumns = columnHeaders.filter((header: string) => {
				const isInvalid = invalidCells?.[header]?.has(rowIndex) ?? false;
				const isToggled = toggledColumns[header];
				return !isInvalid && !isToggled && row[header]?.trim();
			});

			// Try lat/lon pairs first
			const latColumns = activeColumns.filter(
				(header: string) => columnTypes[header] === 'latitude'
			);
			const lonColumns = activeColumns.filter(
				(header: string) => columnTypes[header] === 'longitude'
			);

			// If we have both lat and lon columns, try to combine them
			if (latColumns.length && lonColumns.length) {
				const lat = row[latColumns[0]]?.trim();
				const lon = row[lonColumns[0]]?.trim();
				if (lat && lon) {
					return `${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}`;
				}
			}

			// Fall back to GPS columns
			const gpsColumns = activeColumns.filter((header: string) => columnTypes[header] === 'gps');
			for (const header of gpsColumns) {
				const value = row[header]?.trim();
				if (value) {
					const gpsValue = parseGpsCoordinate(value);
					if (gpsValue) {
						return `${gpsValue.latitude.toFixed(6)}, ${gpsValue.longitude.toFixed(6)}`;
					}
				}
			}
		} catch (error) {
		}
		return '';
	}

	const displayValue = $derived(calculateGpsValue());
</script>

{#if displayValue}
	<td class="gps-column">
		{displayValue}
	</td>
{:else}
	<td class="gps-column">
		<!-- Empty cell -->
	</td>
{/if}
