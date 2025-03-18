<script lang="ts" module>
	export interface TransformEvent {
		detail: {
			records: Array<Record<string, string | number | null>>;
			columnTypes: Record<string, string>;
		};
	}
	import { createColumn, detectColumnType, toggleColumn } from '$lib/utils/columnUtils';

	// State using Svelte 5 runes
	let columns = $state<Column[]>([]);
	let rawData = $state<string[][]>([]);
	let transformedData = $state<Record<string, any>[]>([]);

	// Update the Column interface to match ColumnRep
	interface Column {
		headerName: string;
		type: 'string' | 'number' | 'date' | 'gps' | 'latitude' | 'longitude';
		values: (string | number | null)[];
		// isToggled: boolean;
		// isValid: boolean;
	}

	$effect(() => {
  if (transformedData.length > 0) {
    const event: TransformEvent = {
      detail: {
        records: transformedData,
        columnTypes: columns.reduce((acc, col) => {
          acc[col.headerName] = col.type;
          return acc;
        }, {} as Record<string, string>)
      }
    };
    
    // Use the component's native event dispatching
    dispatchEvent(new CustomEvent('dataTransformed', event));
  }
});

	// Update the transformData function to handle type checking
	function transformData() {
		const records = rawData[0].map((_, colIndex) => {
			return rawData.reduce(
				(acc, row) => {
					acc[columns[colIndex].headerName] = row[colIndex];
					return acc;
				},
				{} as Record<string, string | number | null>
			);
		});

		dispatch('dataTransformed', {
			detail: {
				records,
				columnTypes: columns.reduce(
					(acc, col) => {
						acc[col.headerName] = col.type;
						return acc;
					},
					{} as Record<string, string>
				)
			}
		});
	}
	// Export transformed data
	function exportData() {
		return {
			records: transformedData,
			columnTypes: columns.reduce((acc, col) => {
				acc[col.header] = col.type;
				return acc;
			}, {}),
			toggledColumns: columns.reduce((acc, col) => {
				acc[col.header] = col.isToggled;
				return acc;
			}, {})
		};
	}

	// Public API
	export function loadCsvData(data: string[][]) {
		initializeColumns(data);
		transformData();
	}

	export function updateColumnType(header: string, type: Column['type']) {
		const column = columns.find((col) => col.header === header);
		if (column) {
			column.type = type;
			transformData();
		}
	}

	export function toggleColumnVisibility(header: string, isToggled: boolean) {
		const column = columns.find((col) => col.header === header);
		if (column) {
			column.isToggled = isToggled;
		}
	}

	export function getTransformedData() {
		return exportData();
	}
</script>
