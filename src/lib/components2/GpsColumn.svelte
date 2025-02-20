<script lang="ts">
	const { row, columnHeaders, columnTypes } = $props<{
		row: Record<string, string>;
		columnHeaders: string[];
		columnTypes: Record<string, string>;
	}>();

	// Simply find the first GPS-typed column that has data
	function getGpsDisplayValue(): string {
		const gpsColumn = columnHeaders.find(
			(header) => columnTypes[header] === 'gps' && row[header]?.trim()
		);

		if (gpsColumn) {
			return row[gpsColumn];
		}

		// If no GPS column, look for lat/lon pair
		const latColumn = columnHeaders.find(
			(header) => columnTypes[header] === 'latitude' && row[header]?.trim()
		);
		const lonColumn = columnHeaders.find(
			(header) => columnTypes[header] === 'longitude' && row[header]?.trim()
		);

		if (latColumn && lonColumn) {
			return `${row[latColumn]}, ${row[lonColumn]}`;
		}

		return '';
	}
</script>

<td>
	{getGpsDisplayValue()}
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
		color: #999;
		font-style: italic;
	}
</style>
