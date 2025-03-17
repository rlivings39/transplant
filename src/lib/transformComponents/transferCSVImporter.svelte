<script lang="ts">
	// Keep existing imports
	import { createColumn } from '$lib/utils/columnUtils';
	import { validateNumber } from '$lib/utils/DetectValidFormat/numberType';
	import type { ColumnRep } from '$lib/types/columnModel';
	import Papa from 'papaparse';
	import { createEventDispatcher } from 'svelte';
	import { validateDate } from '$lib/utils/DetectValidFormat/dateType';
	import { validateGps } from '$lib/utils/DetectValidFormat/gpsType';


	let rawData = $state<Record<string, string>[]>([]);
	let fileInput: HTMLInputElement;
	let isFileLoaded = $state(false);
	const dispatch = createEventDispatcher();

	// Modify processFile to use new column model
	function processFile(file: File) {
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				if (results.errors.length > 0) {
					console.error('CSV parsing errors:', results.errors);
				}

				const rows = results.data.filter(
					(row) =>
						Object.keys(row as object).length ===
						Object.keys(results.data[0] || ({} as object)).length
				) as Record<string, string>[];

				if (rows.length > 0) {
					isFileLoaded = true;
					const columns = createColumnsFromRows(rows);
					dispatch('dataLoaded', { data: columns });
				} else {
					console.warn('No valid data rows found in CSV');
					isFileLoaded = false;
				}
			},
			error: (error) => {
				console.error('CSV parsing failed:', error);
				isFileLoaded = false;
				dispatch('error', { error });
			}
		});
	}

	// Add new helper function
	function createColumnsFromRows(rows: any[]): ColumnRep[] {
		const headers = Object.keys(rows[0]);
		return headers.map((header) => {
			const samples = rows.slice(0, 10).map((row) => row[header]);
			const type = detectColumnType(samples);

			const column = createColumn(header, type);
			column.values = rows.map((row) => parseValue(row[header], type));

			return column;
		});
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files[0];
		if (file && file.name.toLowerCase().endsWith('.csv')) {
			processFile(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.currentTarget instanceof HTMLElement) {
			event.currentTarget.classList.add('import-dropzone--drag-active');
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		if (event.currentTarget instanceof HTMLElement) {
			event.currentTarget.classList.remove('import-dropzone--drag-active');
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';

		if (file && file.name.toLowerCase().endsWith('.csv')) {
			processFile(file);
		}
	}

	function detectColumnType(samples: string[]): string {
		if (samples.every((s) => validateNumber(s))) return 'number';
		if (samples.every((s) => validateDate(s))) return 'date';
		if (samples.every((s) => validateGps(s))) return 'gps';
		return 'string';
	}

	function parseValue(value: string, type: string): any {
  switch (type) {
    case 'number':
      return parseFloat(value);
    case 'date':
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toISOString();
    default:
      return value;
  }
}
</script>

<div class="import-container">
	{#if !isFileLoaded}
		<div
			class="import-dropzone"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			role="button"
			tabindex="0"
			aria-label="Drop CSV file here or click to choose file"
		>
			<div class="import-dropzone-content">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				<h2>Drop your CSV file here</h2>
				<p>or</p>
				<button class="import-simple-button" onclick={() => fileInput.click()}>UPLOAD CSV</button>
			</div>
		</div>
	{:else}
		<div class="button-container">
			<div class="import-simple-input-container"></div>
		</div>
	{/if}
	<input
		type="file"
		accept=".csv"
		onchange={handleFileSelect}
		bind:this={fileInput}
		style="display: none;"
	/>
</div>
