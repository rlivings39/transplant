<script>
	import Papa from 'papaparse';
	import { createEventDispatcher } from 'svelte';
	import { setParsed } from '$lib/state/data';

	const dispatch = createEventDispatcher();

	// Use $state for stage management as per MEMORY[a895e3cf]
	let stage = $state('empty');

	async function handleFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		Papa.parse(file, {
			header: true, // As per MEMORY[f8603e5b]
			complete: (results) => {
				setParsed(Object.keys(results.data[0]), results.data);
				// Dispatch with consistent naming
				dispatch('parsedData', {
					data: results.data,
					errors: results.errors,
					meta: results.meta
				});
				stage = 'parsed';
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
