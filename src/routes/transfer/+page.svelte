<!-- src/routes/transfer/+page.svelte -->
<script lang="ts">
    import TransferCSVImporter from '$lib/transformComponents/transferCSVImporter.svelte';
    import TransferDataTable from '$lib/transferComponents/transferDataTable.svelte';
    import type { ColumnRep } from '$lib/types/columnModel';

    let columns = $state<ColumnRep[]>([]);
    let errorMessage = $state<string | null>(null);

    function handleColumnsLoaded(event: CustomEvent<{ columns: ColumnRep[] }>) {
        columns = event.detail.columns;
        errorMessage = null;
    }

    function handleImportError(event: CustomEvent<string>) {
        errorMessage = event.detail;
        columns = [];
    }
    
</script>

<div class="transfer-page">
    <h1>Data Transfer</h1>
    
    <TransferCSVImporter 
        on:columnsLoaded={handleColumnsLoaded}
        on:error={handleImportError}
    />

    {#if errorMessage}
        <div class="error-banner">{errorMessage}</div>
    {:else if columns.length > 0}
        <TransferDataTable {columns} />
    {/if}
</div>

<style>
    .transfer-page {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .error-banner {
        color: #dc3545;
        padding: 1rem;
        margin: 1rem 0;
        border: 1px solid currentColor;
        border-radius: 4px;
    }
</style>