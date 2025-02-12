<script lang="ts">
	import ImportTable from '$lib/components/ImportTable.svelte';
	import CsvImporter from '$lib/components/CsvImporter.svelte';

	type CsvRow = Record<string, string>;
	type ParseError = { message: string };

	let data: CsvRow[] = [];
	let errors: ParseError[] = [];

	function handleParsedData(parsedData: CsvRow[], parseErrors: ParseError[]) {
		data = parsedData;
		errors = parseErrors;
	}
</script>

<div class="container">
	<h1>TransPlant CSV Import</h1>
	<CsvImporter onParsed={handleParsedData} />

	{#if errors.length > 0}
		<div class="error">
			{#each errors as error}
				<p>{error.message}</p>
			{/each}
		</div>
	{/if}

	{#if data.length > 0}
		<ImportTable {data} />
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}
	.error {
		color: red;
		margin: 10px 0;
	}
</style>
