<script lang="ts">
	import TransferCSVImporter from '$lib/transformComponents/transferCSVImporter.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';
	
	let importedData = $state<ColumnRep[] | null>(null);

	function handleProcessed(event: CustomEvent<ColumnRep[]>) {
		console.log('Received processed event:', event.detail);
		importedData = event.detail;
	}
</script>

<TransferCSVImporter onprocessed={handleProcessed} />

{#if importedData}
	<h2>Imported Data</h2>
	<pre>{JSON.stringify(importedData, null, 2)}</pre>
{/if}
