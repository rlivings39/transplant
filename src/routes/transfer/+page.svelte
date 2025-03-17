<script lang="ts">
	import TransferCSVImporter from '$lib/transformComponents/transferCSVImporter.svelte';
	import TransferDataTable from '$lib/transferComponents/transferDataTable.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	let columns: ColumnRep[] = [];

	function handleImport(event: CustomEvent<{ columns: ColumnRep[] }>) {
		columns = event.detail.columns;
	}
</script>

<TransferCSVImporter on:import={handleImport} />
{#if columns.length > 0}
  <TransferDataTable {columns} />
{/if}

<style>
	/* Add any necessary styles */
</style>
