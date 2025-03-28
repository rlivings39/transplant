<script lang="ts">
	import NewTableData from '$lib/transferComponents/newTableData.svelte';
	import TransferCSVImporter from '$lib/transferComponents/transferCSVImporter.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	let importedData = $state<ColumnRep[]>([]);

	function handleProcessed(csvImportToPage: ColumnRep[]) {
		importedData = csvImportToPage || [];
	}
</script>

<TransferCSVImporter onprocessed={handleProcessed} />

<NewTableData {importedData} />

{#if importedData}
	<h2>Imported Data</h2>
	<pre>{JSON.stringify(importedData, null, 2)}</pre>
{/if}
