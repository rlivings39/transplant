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
	<h2>Current Column Model State</h2>
	<pre>
		{JSON.stringify(
			importedData.map((col) => ({
				headerName: col.headerName,
				type: col.type,
				isToggled: col.isToggled,
				isMapped: col.isMapped,
				mappedTo: col.mappedTo,
				isFormatted: col.isFormatted,
				selectTypeCoercion: col.selectTypeCoercion,
				wasTypeCoerced: col.wasTypeCoerced,
				values: col.values.slice(0, 3) // Show first 3 values for brevity
			})),
			null,
			2
		)}
	  </pre>
{/if}
