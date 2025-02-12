<script lang="ts">
	import ImportTable from '$lib/components/ImportTable.svelte';
	import CsvImporter from '$lib/components/CsvImporter.svelte';
	import TransformedHeader from '$lib/components/TransformedHeader.svelte';
	import { logger } from '$lib/utils/logger';


	type CsvRow = Record<string, string>;
	type ParseError = { message: string };

	let data: CsvRow[] = $state([]);
	let errors: ParseError[] = $state([]);

		// Available fields that can be mapped to
		const targetFields = ['land_name', 'crop_name', 'planted', 'planting_date', 'hectares', 'notes'];

	function handleParsedData(parsedData: CsvRow[], parseErrors: ParseError[]) {
		logger.info('CSV Data Parsed', { 
			rowCount: parsedData.length,
			sampleRow: parsedData[0],
			columns: parsedData[0] ? Object.keys(parsedData[0]) : []
		});
		data = parsedData;
		errors = parseErrors;
	}
</script>


<div class="container">
	<h1>TransPlant CSV Import</h1>
	<CsvImporter onParsed={handleParsedData} />

	{#if errors.length > 0}
	<p style="color: #c62828">
		{#each errors as error}
			{error.message}
		{/each}
	</p>
{/if}

	{#if data.length > 0}
			<TransformedHeader 
				headers={Object.keys(data[0])} 
				{targetFields} 
			/>
			<ImportTable {data} />
	{/if}
</div>

