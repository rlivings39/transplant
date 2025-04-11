<script lang="ts">
  const { landsDbTable, plantingDbTable, cropDbTable } = $props<{
    landsDbTable: any[];
    plantingDbTable: any[];
    cropDbTable: any[];
  }>();
  const columns = Object.keys(landsDbTable[0] || {});
  </script>
  
  <table>
    <thead>
      <tr>
        {#each columns as column}
          <th>{column}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each landsDbTable as row}
        <tr>
          {#each columns as column}
            <td>{row[column]}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>