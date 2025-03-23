<script lang="ts">
	import TransferCSVImporter from '$lib/transformComponents/transferCSVImporter.svelte';

	let importedData = $state<any>(null);

	function handleProcessed(event: CustomEvent) {
		console.log('Received processed event:', event.detail);
		importedData = event.detail;
	}
</script>

<TransferCSVImporter onprocessed={handleProcessed} />

{#if importedData}
	<h2>Imported Data</h2>
	<pre>{JSON.stringify(importedData, null, 2)}</pre>
{/if}
