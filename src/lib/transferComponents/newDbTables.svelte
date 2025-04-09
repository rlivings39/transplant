<script lang="ts">
  const { lands } = $props<{
    lands: any[];
  }>();
  const columns = Object.keys(lands[0] || {});
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
      {#each lands as row}
        <tr>
          {#each columns as column}
            <td>{row[column]}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>