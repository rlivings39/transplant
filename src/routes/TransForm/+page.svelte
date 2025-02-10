<script lang="ts">
  import "$lib/styles/custom-pico.scss";

  let headers: string[] = [];
  let types: string[] = [];
  let rows: string[][] = [];

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    const file = input.files[0];
    const text = await file.text();
    
    // Parse CSV
    const allRows = text.split('\n')
      .map(line => line.split(','))
      .filter(row => row.length > 0 && row.some(cell => cell.trim()));

    if (allRows.length < 2) return;

    headers = allRows[0].map(h => h.trim());
    types = new Array(headers.length).fill('gps');
    rows = allRows.slice(1);
  }
</script>

<main class="container">
  <h1>TransForm - CSV Cleanup</h1>
  
  <article>
    <input
      type="file"
      accept=".csv"
      on:change={handleFileUpload}
      aria-label="Upload CSV file"
      class="file-input"
    />
  </article>

  {#if headers.length > 0}
    <article>
      <h2>Preview</h2>
      
      <div class="table-container">
        <table role="grid">
          <thead>
            <tr>
              {#each headers as header, i}
                <th>
                  <select 
                    bind:value={types[i]}
                    class="type-select"
                  >
                    <option value="gps">gps</option>
                    <option value="string">text</option>
                    <option value="number">number</option>
                    <option value="date">date</option>
                    <option value="email">email</option>
                    <option value="url">url</option>
                  </select>
                  {header}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each rows.slice(0, 5) as row}
              <tr>
                {#each row as cell}
                  <td class="data-cell">{cell}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
        {#if rows.length > 5}
          <p><em>Showing first 5 rows of {rows.length} total rows</em></p>
        {/if}
      </div>
    </article>
  {/if}
</main>

<style lang="scss">
  .table-container {
    overflow-x: auto;
    margin-top: 1rem;
    background: #1a1f2e;
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border: 1px solid #2d3748;
    padding: 8px;
    color: #e2e8f0;
  }

  th {
    background: #1a1f2e;
    padding: 8px;
  }

  .type-select {
    width: 100%;
    margin-bottom: 4px;
    padding: 4px 8px;
    background: #1a1f2e;
    color: white;
    border: 1px solid #2d3748;
    border-radius: 4px;
    font-size: 0.9em;

    &:hover {
      border-color: #4a5568;
    }

    &:focus {
      outline: none;
      border-color: var(--color-purple);
    }

    option {
      background: #1a1f2e;
      color: white;
    }
  }

  .data-cell {
    font-family: monospace;
  }

  .file-input {
    width: 100%;
    padding: 1rem;
    margin: 1rem 0;
    border: 2px dashed var(--color-purple);
    border-radius: 4px;
    background: rgba(95, 16, 179, 0.05);
    color: white;

    &:hover {
      border-color: var(--color-white);
      background: rgba(95, 16, 179, 0.1);
    }
  }
</style>