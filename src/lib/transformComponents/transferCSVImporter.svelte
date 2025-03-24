<!-- 
  Svelte 5 $dispatch documentation reference:
  https://svelte.dev/docs/svelte/v5-migration-guide#Event-changes-Component-events
Components should accept callback props - which means you then pass functions as properties to these components
  -->
<script lang="ts">
	import Papa from 'papaparse';
	import type { ColumnRep } from '$lib/types/columnModel';
	import { BaseColumnModel } from '$lib/types/columnModel';

	const { onprocessed } = $props<{
		onprocessed?: (event: CustomEvent<ColumnRep[]>) => void;
	}>();

	let file = $state<File | null>(null);
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleFileSelect(event: Event) {
		console.log('File select event triggered');
		const input = event.target as HTMLInputElement;
		file = input.files?.[0] ?? null;

		if (!file) {
			console.log('No file selected');
			error = 'No file selected';
			return;
		}

		console.log('Selected file:', file.name, file.type, file.size + ' bytes');

		if (file.type !== 'text/csv') {
			console.log('Invalid file type:', file.type);
			error = 'Please upload a CSV file';
			return;
		}

		try {
			console.log('Starting CSV parsing');
			isLoading = true;
			error = null;

			const results = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
				Papa.parse(file!, {
					header: true,
					skipEmptyLines: true,
					complete: resolve,
					transform: (value) => value.trim(),
					error: reject
				});
			});

			console.log('CSV parsing completed');

			function processCSV(results: Papa.ParseResult<any>) {
				if (results.errors.length > 0) {
					error = results.errors.map((e) => e.message).join(', ');
					return;
				}

				const data = results.data;
				if (!data || data.length === 0) {
					error = 'No data found in CSV';
					return;
				}

				// Transform data into ColumnRep format
				const headers = Object.keys(data[0]);
				const columnData: ColumnRep[] = headers.map((header) => {
					// Create a base column model with defaults
					const baseColumn = new BaseColumnModel(header);
					// Override the default isToggled value (BaseColumnModel sets it to true by default)
					baseColumn.isToggled = false;

					// Return a ColumnRep object by extending the base column
					return {
						...baseColumn,
						type: 'string', // Default type
						values: data.map((row) => row[header])
					};
				});

				// Dispatch the transformed data
				onprocessed?.(new CustomEvent('processed', { detail: columnData }));
			}

			processCSV(results);
		} catch (err) {
			console.error('CSV parsing failed:', err);
			error = 'Failed to parse CSV file';
		} finally {
			console.log('Processing complete');
			isLoading = false;
		}
	}
</script>

<input type="file" accept=".csv" onchange={handleFileSelect} disabled={isLoading} />

{#if error}
	<p class="error">{error}</p>
{/if}

{#if isLoading}
	<p>Loading...</p>
{/if}
