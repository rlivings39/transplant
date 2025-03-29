<script lang="ts">
  import type { ColumnRep } from '$lib/types/columnModel';

  const { column } = $props<{
    column: ColumnRep;
  }>();

  const types = ['string', 'number', 'date', 'gps'];

  function handleChange(event: Event) {
    const newType = (event.target as HTMLSelectElement).value as 'string' | 'number' | 'date' | 'gps';
    column.changeType(newType, 'user');
    console.log(`Changed column ${column.headerName} type to ${newType}`);
  }
</script>

<div class="type-selector">
  <select bind:value={column.type} onchange={handleChange}>
    {#each types as type}
      <option value={type}>{type}</option>
    {/each}
  </select>
</div>
