<script>
	import ImportTable from '$lib/components/ImportTable.svelte';
	import CsvImporter from '$lib/components/CsvImporter.svelte';

	// State management using runes as per MEMORY[a895e3cf]
	let stage = $state('empty');
	let data = $state([]);
	let errors = $state([]);

	// Derived state as per MEMORY[5330af14]
	let isParsed = $derived(stage === 'csv');

<<<<<<< HEAD
	function handleCsvLoaded(event) {
		const { data: ParsedDataState, errors: csvErrors } = event.detail;
		data = ParsedDataState;
		errors = csvErrors;
=======
	function handleParsedData(event) {
		const { data: parsedData, errors: parseErrors } = event.detail;
		data = parsedData;
		errors = parseErrors;
>>>>>>> 2f1bbc5469db357ba02c87d5185593fd05547312
	}
</script>

<button onclick={() => 'transformed'}>Next Header</button>
<br />
<div>
	<CsvImporter on:parsedData={handleParsedData} />

	{#if errors.length > 0}
		<div class="error">
			{#each errors as error}
				<p>{error.message}</p>
			{/each}
		</div>
	{/if}

	{#if isParsed}
		<ImportTable tableData={data} />
	{/if}
</div>

<!-- svelte-ignore css_unused_selector -->
<style lang="scss">
	@import '$lib/styles/custom-pico.scss';
</style>
