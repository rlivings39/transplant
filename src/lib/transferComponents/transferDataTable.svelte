<script lang="ts">
    import ColumnManager from './ColumnManager.svelte';
    import NumberColumn from './ColumnComponents/NumberColumn.svelte';
    import type { ColumnRep } from '$lib/types/columnModel';

    const { importedColumns } = $props<{
  importedColumns: ColumnRep[];
}>();

    let transformedData = $state([]);
</script>

<ColumnManager bind:columns={importedColumns} bind:transformedData>