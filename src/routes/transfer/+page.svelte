<script lang="ts">
	import NewTableData from '$lib/transferComponents/newTableData.svelte';
	import TransferCSVImporter from '$lib/transferComponents/transferCSVImporter.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';
	import { importedData, setImportedData } from '$lib/transferComponents/modelState.svelte';

	function handleProcessed(csvImportToPage: ColumnRep[]) {
		setImportedData(csvImportToPage || []);
	}
</script>

<TransferCSVImporter onprocessed={handleProcessed} />

<NewTableData  />

{#if importedData.columns}
	<h2>Current Column Model State</h2>
	<pre>
		{JSON.stringify(
			importedData.columns.map((col) => ({
			  headerName: col.headerName,
			  type: col.type,
			  currentFormat: col.currentFormat, // Add this
			  isToggled: col.isToggled,
			  isMapped: col.isMapped,
			  mappedTo: col.mappedTo,
			  isFormatted: col.isFormatted,
			  selectFormatCoercion: col.selectFormatCoercion, // Updated name
			  wasFormatCoerced: col.wasFormatCoerced, // Updated name
			  values: col.values.slice(0, 3)
			})),
			null,
			2
		  )}
	  </pre>
{/if}
