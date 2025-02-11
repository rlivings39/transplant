<script>
	import Papa from 'papaparse';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Use $state for stage management as per MEMORY[a895e3cf]
	let stage = $state('empty');

	async function handleFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		Papa.parse(file, {
			header: true, // As per MEMORY[f8603e5b]
			complete: (results) => {
				// Don't transform data yet, just parse it
				dispatch('csvLoaded', {
					data: results.data,
					errors: results.errors,
					meta: results.meta
				});
				stage = 'csv';
			},
			error: (error) => {
				dispatch('error', error);
			}
		});
	}
</script>

<div>
	<input type="file" accept=".csv" onchange={handleFileSelect} style="margin-bottom: 1rem;" />
</div>
