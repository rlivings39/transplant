<script lang="ts">
	const { row, columnHeaders, columnTypes, toggledColumns, invalidCells, rowIndex } = $props<{
		row: Record<string, string>;
		columnHeaders: string[];
		columnTypes: Record<string, string>;
		toggledColumns: Record<string, boolean>;
		invalidCells: Record<string, Set<number>>;
		rowIndex: number;
	}>();

	function isValidCell(header: string): boolean {
		return !toggledColumns[header] && !(invalidCells?.[header]?.has(rowIndex) ?? false);
	}

	function getGpsDisplayValue(): string {
		// Only look at columns that are valid for this row
		const activeColumns = columnHeaders.filter(
			(header) => isValidCell(header) && row[header]?.trim()
		);

		// First try columns already validated as GPS type
		for (const header of activeColumns) {
			if (columnTypes[header] === 'gps') {
				return row[header].trim();
			}
		}

		// Then try latitude/longitude pairs
		const latColumns = activeColumns.filter((header) => columnTypes[header] === 'latitude');
		const lonColumns = activeColumns.filter((header) => columnTypes[header] === 'longitude');

		for (const latCol of latColumns) {
			const lat = row[latCol].trim();

			for (const lonCol of lonColumns) {
				const lon = row[lonCol].trim();
				return `${lat}, ${lon}`;
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
