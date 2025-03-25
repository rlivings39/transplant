<script lang="ts">
    import { columnTypes } from '$lib/types/columnModel';
  
    export let columnName: string;
    export let currentType: string;
  
    const types = ['string', 'number', 'date', 'gps'];
  
    function handleTypeChange(event: Event) {
      const select = event.target as HTMLSelectElement;
      columnTypes[columnName] = select.value;
    }
  </script>
  
  <div class="type-selector">
    <select value={currentType} onchange={handleTypeChange}>
      {#each types as type}
        <option value={type}>{type}</option>
      {/each}
    </select>
  </div>
  
  <style>
    .type-selector {
      padding: 0.25rem;
    }
    
    select {
      width: 100%;
      padding: 0.25rem;
      border-radius: 0.25rem;
    }
  </style>