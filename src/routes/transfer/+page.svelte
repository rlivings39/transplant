<script lang="ts">
	import NewTableData from '$lib/transformComponents/newTableData.svelte';
	import TransferCSVImporter from '$lib/transformComponents/transferCSVImporter.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	let importedData = $state<ColumnRep[] | null>(null);

	function handleProcessed(csvImportToPage: ColumnRep[]) {
		console.log('Received processed event:', csvImportToPage);
		console.log('Number of columns:', csvImportToPage.length);
		console.log('First column data:', csvImportToPage[0]);
		importedData = csvImportToPage;
	}
</script>

<TransferCSVImporter onprocessed={handleProcessed} />

<NewTableData {importedData} />

{#if importedData}
	<h2>Imported Data</h2>
	<pre>{JSON.stringify(importedData, null, 2)}</pre>
{/if}
