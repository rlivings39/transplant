<!-- 
  Svelte 5 $dispatch documentation reference:
  https://svelte.dev/docs/svelte/v5-migration-guide#Event-changes-Component-events
Components should accept callback props - which means you then pass functions as properties to these components
  -->
<script lang="ts">
  import Papa from 'papaparse';

  const { onprocessed } = $props<{
    onprocessed?: (event: CustomEvent<any>) => void;
  }>();

  let file = $state<File | null>(null);
  let error = $state<string | null>(null);
  let isLoading = $state(false);

  async function handleFileSelect(event: Event) {
    console.log('File select event triggered');
    const input = event.target as HTMLInputElement;
    file = input.files?.[0] ?? null;
    
    if (!file) {
      console.log('No file selected');
      error = 'No file selected';
      return;
    }

    console.log('Selected file:', file.name, file.type, file.size + ' bytes');

    if (file.type !== 'text/csv') {
      console.log('Invalid file type:', file.type);
      error = 'Please upload a CSV file';
      return;
    }

    try {
      console.log('Starting CSV parsing');
      isLoading = true;
      error = null;

      const results = await new Promise<Papa.ParseResult<string[]>>((resolve, reject) => {
        Papa.parse(file!, {
          header: false,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        });
      });

      console.log('CSV parsing completed');
      
      if (results.errors.length > 0) {
        console.error('CSV parsing errors:', results.errors);
        error = 'Error parsing CSV file';
        return;
      }

      console.log('Raw CSV data:', results.data);

      const rawData = results.data;
      const importedData = rawData.length === 0
        ? []
        : rawData[0].map((header, index) => ({
            headerName: header,
            type: 'string' as const,
            values: rawData.slice(1).map(row => row[index]),
            isToggled: false,
            isFormatted: false
          }));

      console.log('Processed data structure:', importedData);

      // 🔥 New event model
      if (onprocessed) {
        console.log('Dispatching processed event');
        onprocessed(new CustomEvent('processed', { detail: importedData }));
      } else {
        console.warn('No onprocessed handler provided');
      }
      
    } catch (err) {
      console.error('CSV parsing failed:', err);
      error = 'Failed to parse CSV file';
    } finally {
      console.log('Processing complete');
      isLoading = false;
    }
  }
</script>

<input 
  type="file" 
  accept=".csv" 
  onchange={handleFileSelect} 
  disabled={isLoading}
/>

{#if error}
  <p class="error">{error}</p>
{/if}

{#if isLoading}
  <p>Loading...</p>
{/if}