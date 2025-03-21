<!-- src/routes/transfer/+page.svelte -->
<script lang="ts">
	import TransferCSVImporter from '$lib/transformComponents/transferCSVImporter.svelte';
	import TransferDataTable from '$lib/transferComponents/transferDataTable.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	let columnRep = $state<ColumnRep[]>([]);
	let errorMessage = $state<string | null>(null);


</script>

<div class="transfer-page">
	<h1>Data Transfer</h1>

	<TransferCSVImporter />

	{#if errorMessage}
		<div class="error-banner">{errorMessage}</div>
	{:else if columnRep.length > 0}
		<TransferDataTable {columnRep} {columnTypes} {toggledColumns} {invalidCells} />
	{/if}
</div>
