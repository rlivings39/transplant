<script lang="ts">
	import Papa from 'papaparse';
	import type { ColumnRep } from '$lib/types/columnModel';

	let rawCsvDataState = $state<string[][]>([]);
	let errorMessage = $state<string | null>(null);

	const { onProcessedData, onError } = $props<{
		onProcessedData: (csvDataParam: ColumnRep[]) => void;
		onError: (message: string) => void;
	}>();

	function CsvToColumnRepFn(CsvDataLocal: string[][]): ColumnRep[] {
		if (CsvDataLocal.length === 0) return [];
		const headers = CsvDataLocal[0];
		return headers.map((header, index) => ({
			headerName: header,
			type: 'string',
			values: CsvDataLocal.slice(1).map((row) => row[index]),
			isToggled: false,
			isFormatted: false
		}));
	}

	function parseCsvFn(file: File) {
		Papa.parse(file, {
			header: false,
			skipEmptyLines: true,
			complete: (results) => {
				if (results.errors.length > 0) {
					errorMessage = 'Error parsing CSV file';
					onError(errorMessage);
					return;
				}
				rawCsvDataState = results.data as string[][];
				const csvDataParam = CsvToColumnRepFn(rawCsvDataState);
				onProcessedData(csvDataParam);
			},
			error: (error) => {
				errorMessage = 'Failed to parse CSV file';
				onError(errorMessage);
			}
		});
	}

	function handleFileSelect(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		if (file.type !== 'text/csv') {
			errorMessage = 'Please upload a CSV file';
			onError(errorMessage);
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			// 5MB limit
			errorMessage = 'File size must be less than 5MB';
			onError(errorMessage);
			return;
		}

		parseCsvFn(file);
	}
</script>

<div class="csv-importer">
	<input type="file" accept=".csv" onchange={handleFileSelect} />
	{#if errorMessage}
		<div class="error">{errorMessage}</div>
	{/if}
</div>
