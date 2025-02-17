<script lang="ts">
    import CSVImporter from './CSVImporter.svelte';
    import DataPreviewTable from './DataPreviewTable.svelte';
  
    let transformedData = $state<Record<string, any>[]>([]);
  
    function handleDataLoaded(event: CustomEvent<{ data: Record<string, string>[] }>) {
      transformedData = event.detail.data;
    }
  </script>
  
  <div class="transform-manager">
    <CSVImporter on:dataLoaded={handleDataLoaded} />
    {#if transformedData.length > 0}
      <DataPreviewTable data={transformedData} />
    {/if}
  </div>