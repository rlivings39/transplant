<script lang="ts">
	import Papa from 'papaparse';
	import { createEventDispatcher } from 'svelte';

	let rawData = $state<Record<string, string>[]>([]);

	const dispatch = createEventDispatcher<{
		dataLoaded: { data: Record<string, string>[] };
	}>();

	function handleFileSelect(event: Event) {
		const file = (event.target as HTMLInputElement)?.files?.[0];
		if (!file) return;

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				rawData = results.data.filter(
					(row) =>
						Object.keys(row as object).length ===
						Object.keys((results.data[0] || {}) as object).length
				) as Record<string, string>[];

				dispatch('dataLoaded', { data: rawData });
			}
		});
	}
</script>

<div class="csv-importer">
	<input type="file" accept=".csv" onchange={handleFileSelect} class="file-input" />
</div>
