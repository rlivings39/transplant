<script lang="ts">
	import Papa from 'papaparse';
	import type { ColumnRep } from '$lib/types/columnModel';

	// // Props
	// const { onProcessedData, onError } = $props<{
	//   onProcessedData: (importedData: ColumnRep[]) => void;
	//   onError: (handleErrorVar: string) => void;
	// }>();

	let columnRep = $state<ColumnRep[]>([]);

	function handleProcessedData(assignColumnRepVar: ColumnRep[]) {
		columnRep = assignColumnRepVar;
	}
  
  $effect(() => {
      console.log('ColumnRep updated:', columnRep);
  });

	function handleError(message: string) {
		console.error(message);
	}
	// Main Function: Parses and transforms CSV data in one step
	function CsvParseAndStructureFn(file: File) {
		Papa.parse(file, {
			header: false,
			skipEmptyLines: true,
			complete: (results) => {
				if (results.errors.length > 0) {
					handleError('Error parsing CSV file');
					return;
				}
				const rawData = results.data as string[][];
				const importedData = rawData.length === 0 ? [] : rawData[0].map((header, index) => ({
    headerName: header,
    type: 'string' as const, // Add 'as const' here
    values: rawData.slice(1).map(row => row[index]),
    isToggled: false,
    isFormatted: false
}));
				handleProcessedData(importedData); // Send structured data to parent
			},
			error: (error) => {
				handleError('Failed to parse CSV file');
			}
		});
	}

	// Event Handler: Handles file selection
	function handleFileSelect(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		if (file.type !== 'text/csv') {
			handleError('Please upload a CSV file');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			// 5MB limit
			handleError('File size must be less than 5MB');
			return;
		}

		CsvParseAndStructureFn(file);
	}
</script>

<div class="csv-importer">
	<input type="file" accept=".csv" onchange={handleFileSelect} />
</div>
