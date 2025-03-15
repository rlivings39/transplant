<script>
    import ColumnManager from './ColumnManager.svelte';
    import { NumberColumn } from './ColumnComponents/NumberColumn.svelte';
    
    let columns = $state([]);
    let transformedData = $state([]);
</script>

<ColumnManager bind:columns bind:transformedData>
    {#each columns as column}
        <svelte:component this={column.component} {column} />
    {/each}
</ColumnManager>