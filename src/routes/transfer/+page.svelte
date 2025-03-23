<!-- src/routes/transfer/+page.svelte -->
<script lang="ts">
	import TransferCSVImporter from '$lib/transformComponents/transferCSVImporter.svelte';
	import TransferDataTable from '$lib/transferComponents/transferDataTable.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	let columnRep = $state<ColumnRep[]>([]);
	let errorMessage = $state<string | null>(null);
	let columnTypes = $state<Record<string, string>>({});
	let toggledColumns = $state<Record<string, boolean>>({});
	let invalidCells = $state<Record<string, number[]>>({});


	$effect(() => {
		console.log('columnRep updated:', $state.snapshot(columnRep));
		console.log('columnTypes:', $state.snapshot(columnTypes));
		console.log('toggledColumns:', $state.snapshot(toggledColumns));
		console.log('invalidCells:', $state.snapshot(invalidCells));
	});
</script>

<div class="transfer-page">
	<h1>Data Transfer</h1>

	<TransferCSVImporter  bind:columnRep />

	{#if errorMessage}
		<div class="error-banner">{errorMessage}</div>
	{:else if columnRep.length > 0}
		<TransferDataTable {columnRep} {columnTypes} {toggledColumns} {invalidCells} />
	{/if}
</div>
