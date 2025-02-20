<script lang="ts">
	const { row, columnHeaders, columnTypes, toggledColumns } = $props<{
		row: Record<string, string>;
		columnHeaders: string[];
		columnTypes: Record<string, string>;
		toggledColumns: Record<string, boolean>;
	}>();

	function isValidDecimalPair(value: string): boolean {
		const parts = value.split(/[,\s]+/).map((p) => p.trim());
		if (parts.length !== 2) return false;

		const [lat, lon] = parts.map(parseFloat);
		return !isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
	}

	function formatLatLon(lat: string, lon: string): string | null {
		const latNum = parseFloat(lat);
		const lonNum = parseFloat(lon);
		if (!isNaN(latNum) && !isNaN(lonNum) && Math.abs(latNum) <= 90 && Math.abs(lonNum) <= 180) {
			return `${latNum}, ${lonNum}`;
		}
		return null;
	}

	function getGpsDisplayValue(): string {
		const activeColumns = columnHeaders.filter((header) => !toggledColumns[header]);

		// First try each column for a valid decimal pair
		for (const header of activeColumns) {
			const value = row[header]?.trim();
			if (value && isValidDecimalPair(value)) {
				return value;
			}
		}

		// If no valid pair found, try to combine latitude/longitude columns
		const latColumns = activeColumns.filter((header) => columnTypes[header] === 'latitude');
		const lonColumns = activeColumns.filter((header) => columnTypes[header] === 'longitude');

		for (const latCol of latColumns) {
			const lat = row[latCol]?.trim();
			if (!lat) continue;

			for (const lonCol of lonColumns) {
				const lon = row[lonCol]?.trim();
				if (!lon) continue;

				const formatted = formatLatLon(lat, lon);
				if (formatted) {
					return formatted;
				}
			}
		}

		return '';
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
