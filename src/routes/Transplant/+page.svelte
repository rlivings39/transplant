<script>
	import ImportTable from '$lib/components/ImportTable.svelte';
	import CsvImporter from '$lib/components/CsvImporter.svelte';

	// State management using runes as per MEMORY[a895e3cf]
	let stage = $state('empty');
	let data = $state([]);
	let errors = $state([]);

	// Derived state as per MEMORY[5330af14]
	let isCsvLoaded = $derived(stage === 'csv');

	function handleCsvLoaded(event) {
		const { data: csvData, errors: csvErrors } = event.detail;
		data = csvData;
		errors = csvErrors;
	}
</script>

<button onclick={() => ('transformed')}>Next Header</button>
<br />
<div>
	<CsvImporter on:csvLoaded={handleCsvLoaded} />

	{#if errors.length > 0}
		<div class="error">
			{#each errors as error}
				<p>{error.message}</p>
			{/each}
		</div>
	{/if}

	{#if isCsvLoaded}
		<ImportTable tableData={data} />
	{/if}
</div>

<!-- svelte-ignore css_unused_selector -->
<style lang="scss">
	@import '$lib/styles/custom-pico.scss';
</style>
