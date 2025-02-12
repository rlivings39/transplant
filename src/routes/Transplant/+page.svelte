<script lang="ts">
	import ImportTable from '$lib/components/ImportTable.svelte';
	import CsvImporter from '$lib/components/CsvImporter.svelte';
	import TransformedHeader from '$lib/components/TransformedHeader.svelte';

	type CsvRow = Record<string, string>;
	type ParseError = { message: string };

	let data: CsvRow[] = $state([]);
	let errors: ParseError[] = $state([]);

		// Available fields that can be mapped to
		const targetFields = ['land_name', 'crop_name', 'planted', 'planting_date', 'hectares', 'notes'];

	function handleParsedData(parsedData: CsvRow[], parseErrors: ParseError[]) {
		data = parsedData;
		errors = parseErrors;
	}
</script>


<div class="container">

{#if data.length > 0}
		<TransformedHeader 
			headers={Object.keys(data[0])} 
			{targetFields} 
		/>
		<ImportTable {data} />
	{/if}

<div class="container">
	<h1>TransPlant CSV Import</h1>
	<CsvImporter onParsed={handleParsedData} />

	{#if errors.length > 0}
		<div class="error-container" style="margin: 1rem 0; padding: 1rem; background: #ffebee; border-radius: 0.25rem;">
			<h4 style="margin: 0 0 0.5rem 0; color: #c62828;">CSV Parse Errors:</h4>
			<ul style="margin: 0; padding-left: 1.5rem;">
				{#each errors as error}
					<li style="color: #c62828;">{error.message}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if data.length > 0}
			<TransformedHeader 
				headers={Object.keys(data[0])} 
				{targetFields} 
			/>
			<ImportTable {data} />
	{/if}
</div>
</div>
