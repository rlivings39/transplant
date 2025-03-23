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
		console.log('columnRep updated:', $state.snapshot(columnRep));
	});

	function handleError(message: string) {
		console.error(message);
	}
	
  function processCSVData(rawData: string[][]): ColumnRep[] {
  const importedData = rawData[0].map((headerName, index) => ({
    headerName,
    type: 'string', // Default type
    values: rawData.slice(1).map((row) => row[index]),
    isToggled: true,
    isFormatted: false,
    validationErrors: new Set<number>()
  }));

  console.log('Processed columns:', importedData.length);
  importedData.forEach((col, i) => {
    console.log(`Column ${i}:`, {
      header: col.headerName,
      type: col.type,
      values: col.values.slice(0, 3), // Show first 3 values
      isToggled: col.isToggled,
      isFormatted: col.isFormatted
    });
  });

  return importedData;
}

	// Main Function: Parses and transforms CSV data in one step
	// function CsvParseAndStructureFn(file: File) {
	// 	Papa.parse(file, {
	// 		header: false,
	// 		skipEmptyLines: true,
	// 		complete: (results) => {
	// 			if (results.errors.length > 0) {
	// 				handleError('Error parsing CSV file');
	// 				return;
	// 			}
	// 			const rawData = results.data as string[][];
	// 			const importedData =
	// 				rawData.length === 0
	// 					? []
	// 					: rawData[0].map((header, index) => ({
	// 							headerName: header,
	// 							type: 'string' as const, // Add 'as const' here
	// 							values: rawData.slice(1).map((row) => row[index]),
	// 							isToggled: false,
	// 							isFormatted: false
	// 						}));
	// 			handleProcessedData(importedData); // Send structured data to parent
	// 		},
	// 		error: (error) => {
	// 			handleError('Failed to parse CSV file');
	// 		}
	// 	});
	// }

	// Event Handler: Handles file selection
	async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (file.type !== 'text/csv') {
    handleError('Please upload a CSV file');
    return;
  }

  try {
    const results = await new Promise<Papa.ParseResult<string[]>>((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      });
    });

    if (results.errors.length > 0) {
      handleError('Error parsing CSV file');
      return;
    }

    const rawData = results.data as string[][];
    console.log('CSV Parsing Results:', {
      fileName: file.name,
      size: file.size,
      rows: rawData.length,
      columns: rawData[0]?.length || 0,
      sampleData: rawData.slice(0, 3) // Show first 3 rows
    });

    const importedData = processCSVData(rawData);
    handleProcessedData(importedData);
    console.log('Processed Data:', importedData);
  } catch (error) {
    handleError('Failed to parse CSV file');
  }
}

	function validateImportedData(data: ColumnRep[]): boolean {
		return data.every((column) => column.headerName && column.values.length > 0);
	}
</script>

<div class="csv-importer">
	<input type="file" accept=".csv" onchange={handleFileSelect} />
</div>
