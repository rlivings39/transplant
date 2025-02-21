<script lang="ts">
	import Papa from 'papaparse';
	import { createEventDispatcher } from 'svelte';

	let rawData = $state<Record<string, string>[]>([]);
	let fileInput: HTMLInputElement;

	const dispatch = createEventDispatcher<{
		dataLoaded: { data: Record<string, string>[] };
	}>();

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		// Clear the input value to ensure change event fires even if same file is selected
		input.value = '';

		if (!file) {
			console.log('No file selected');
			return;
		}

		if (!file.name.toLowerCase().endsWith('.csv')) {
			console.log('Selected file is not a CSV');
			return;
		}

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				if (results.errors.length > 0) {
					console.error('CSV parsing errors:', results.errors);
				}

				rawData = results.data.filter(
					(row) =>
						Object.keys(row as object).length ===
						Object.keys((results.data[0] || {}) as object).length
				) as Record<string, string>[];

				dispatch('dataLoaded', { data: rawData });
			},
			error: (error) => {
				console.error('CSV parsing failed:', error);
			}
		});
	}
</script>

<div class="csv-importer">
	<input
		type="file"
		accept=".csv"
		on:change={handleFileSelect}
		class="file-input"
		bind:this={fileInput}
	/>
</div>

<style>
	.csv-importer {
		margin: 1rem 0;
	}

	.file-input {
		cursor: pointer;
	}
</style>
