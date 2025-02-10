<!-- TransForm.svelte -->
<script lang="ts">
  /// <reference lib="dom" />
  import '$lib/styles/tables.css';
  import { goto } from '$app/navigation';
  import { exportToCSV } from './csvExport';
  import Papa from 'papaparse';
  import type { CsvColumnType } from '$lib/shared/csv/validation/types';

  interface GpsPoint {
    lat: number;
    lon: number;
  }
// test
  interface ColumnData {
    name: string;
    sampleValues: string[];
    allValues: string[];
    previewValues: string[];
  }

  interface ColumnAnalysis extends ColumnData {
    currentType: CsvColumnType;
    suggestedType: CsvColumnType;
    confidence: number;
    totalRows: number;
    validRows: number;
    invalidValues: string[];
  }

  interface CsvRow {
    [key: string]: string;
  }

  // Constants
  const previewLimit = 1000; // Maximum number of rows to show in preview

  // DOM References
  let fileInput: HTMLInputElement;

  // State management with runes
  let fileName = $state('');
  let totalRows = $state(0);
  let columns = $state<ColumnAnalysis[]>([]);
  let status = $state<'ready' | 'processing' | 'validated' | 'mapped' | 'error'>('ready');
  let error = $state<string | null>(null);

  // Derived state
  let hasData = $derived(columns.length > 0);
  let showPreviewWarning = $derived(totalRows > previewLimit);

  // Computed State
  $: validationState = {
    columnsData: columns,
    columns: columns,
    status,
    error,
    fileName
  };

  function isLatitude(value: string): boolean {
    if (!value) return false;
    // Remove trailing comma if present
    const cleaned = value.trim().replace(/,$/, '');

    // Check DMS format with optional comma
    if (cleaned.match(/^\d+°\s*\d+'\s*\d+"\s*[NS]$/i)) return true;

    // Check decimal format
    const num = parseFloat(cleaned);
    return !isNaN(num) && Math.abs(num) <= 90;
  }

  function isLongitude(value: string): boolean {
    if (!value) return false;
    const cleaned = value.trim();

    // Check DMS format
    if (cleaned.match(/^\d+°\s*\d+'\s*\d+"\s*[EW]$/i)) return true;

    // For decimal format, must be explicitly marked as longitude
    // or be paired with a valid latitude
    const num = parseFloat(cleaned);
    return !isNaN(num) && Math.abs(num) <= 180;
  }

  function isCommaSeparatedNumber(value: string): boolean {
    if (!value) return false;
    // Match patterns like 1,234 or 1,234.56
    return /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(value.trim());
  }

  // Function to parse DMS format
  function parseDMS(dms: string): number | null {
    // Match patterns like "51° 30' 26" N" or "51 30 26 N"
    const pattern = /^\s*(\d+)\s*(?:°|\s+)\s*(\d+)\s*(?:'|\s+)\s*(\d+(?:\.\d+)?)\s*(?:"|''|\s+)?\s*([NSEW])\s*$/i;
    const match = dms.match(pattern);
    if (!match) return null;

    const [_, degrees, minutes, seconds, direction] = match;
    let decimal = parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / 3600;
    if (direction.toUpperCase() === 'S' || direction.toUpperCase() === 'W') {
      decimal = -decimal;
    }
    return decimal;
  }

  // File Upload and CSV Parsing
  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Update file name and status
    fileName = file.name;
    status = 'processing';

    // Reset states
    columns = [];
    totalRows = 0;
    error = null;

    try {
      // Read and parse CSV
      const text = await file.text();
      Papa.parse<CsvRow>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            error = results.errors[0].message;
            status = 'error';
            return;
          }

          if (results.data.length === 0) {
            error = 'No data found in CSV file';
            status = 'error';
            return;
          }

          // Process columns
          const newColumns: ColumnAnalysis[] = Object.keys(results.data[0]).map(colName => {
            const values = results.data.map(row => row[colName] || '');
            const { suggestedType, confidence } = analyzeColumnType(values);
            return {
              name: colName,
              currentType: 'string',
              suggestedType,
              confidence,
              totalRows: results.data.length,
              validRows: values.length,
              sampleValues: values.slice(0, previewLimit),
              allValues: values,
              previewValues: values.slice(0, previewLimit),
              invalidValues: []
            };
          });

          // Update state
          columns = newColumns;
          totalRows = results.data.length;
          status = 'validated';
        },
        error: (error: Error) => {
          error = error.message;
          status = 'error';
        }
      });
    } catch (error) {
      rawCsvState.error = error instanceof Error ? error.message : 'Error processing file';
      rawCsvState.csvStatus = 'csverror';
    }
  }

  function resetStates() {
    fileName = '';
    totalRows = 0;
    columns = [];
    status = 'ready';
    error = null;

    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Column Type Detection and Validation
  function analyzeColumnType(values: string[]): { suggestedType: CsvColumnType; confidence: number } {
    if (values.length === 0) return { suggestedType: 'string', confidence: 1 };

    const typeMatches = {
      number: 0,
      date: 0,
      email: 0,
      url: 0,
      gps: 0,
      boolean: 0
    };

    const nonEmptyValues = values.filter(v => v.trim() !== '');
    if (nonEmptyValues.length === 0) return { suggestedType: 'string', confidence: 1 };

    for (const value of nonEmptyValues) {
      const trimmed = value.trim();
      
      // Check for GPS coordinates
      if (isLatitude(trimmed) || isLongitude(trimmed) || /^\d+\.\d+,\s*\d+\.\d+$/.test(trimmed)) {
        typeMatches.gps++;
        continue;
      }

      // Check for numbers (including comma-separated)
      if (isCommaSeparatedNumber(trimmed) || /^-?\d*\.?\d+$/.test(trimmed)) {
        typeMatches.number++;
        continue;
      }

      // Check for dates
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || 
          /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed) ||
          /^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
        typeMatches.date++;
        continue;
      }

      // Check for emails
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        typeMatches.email++;
        continue;
      }

      // Check for URLs
      if (/^https?:\/\/.+/.test(trimmed)) {
        typeMatches.url++;
        continue;
      }

      // Check for booleans
      if (/^(true|false|yes|no|1|0)$/i.test(trimmed)) {
        typeMatches.boolean++;
      }
    }

    // Find the type with the most matches
    const entries = Object.entries(typeMatches);
    const [bestType, matches] = entries.reduce((max, curr) => 
      curr[1] > max[1] ? curr : max
    );

    const confidence = matches / nonEmptyValues.length;

    // Map internal types to CsvColumnType
    const typeMap: Record<string, CsvColumnType> = {
      number: 'number',
      date: 'date',
      email: 'email',
      url: 'url',
      gps: 'gps',
      boolean: 'boolean'
    };

    return {
      suggestedType: confidence > 0.7 ? typeMap[bestType] || 'string' : 'string',
      confidence
    };

    let counts = {
      number: 0,
      date: 0,
      email: 0,
      url: 0,
      gps: 0
    };

    const total = values.length;
    values.forEach(value => {
      if (!value.trim()) return;
      if (numberPattern.test(value)) counts.number++;
      else if (datePattern.test(value)) counts.date++;
      else if (emailPattern.test(value)) counts.email++;
      else if (urlPattern.test(value)) counts.url++;
      else if (gpsPattern.test(value)) counts.gps++;
    });

    const typeConfidence = Object.entries(counts).map(([type, count]) => ({
      type: type as CsvColumnType,
      confidence: count / total
    }));

    const bestMatch = typeConfidence.reduce((best, current) => 
      current.confidence > best.confidence ? current : best,
      { type: 'string' as CsvColumnType, confidence: 0 }
    );

    return {
      suggestedType: bestMatch.confidence > 0.8 ? bestMatch.type : 'string',
      confidence: bestMatch.confidence
    };
  }

  function handleTypeChange(columnName: string, newType: CsvColumnType) {
    const columnIndex = rawCsvState.csvColumns.findIndex(col => col.name === columnName);
  // Handle type changes
  function handleTypeChange(columnName: string, newType: CsvColumnType) {
    columns = columns.map(col => {
      if (col.name === columnName) {
        return { ...col, currentType: newType };
      }
      return col;
    });
  }

  // Reset states
  function resetStates() {
    fileName = '';
    totalRows = 0;
    columns = [];
    status = 'ready';
    error = null;
  }
</script>

<main class="container">
  <h1>TransForm - CSV Cleanup</h1>

  <!-- File Upload -->
  <article>
    <input
      type="file"
      accept=".csv"
      bind:this={fileInput}
      on:change={handleFileSelect}
      style="display: none;"
    />
    <button
      class="primary"
      on:click={() => fileInput.click()}
    >
      Upload CSV
    </button>
    {#if fileName}
      <span class="filename">{fileName}</span>
    {/if}
  </article>

  <!-- Error Display -->
  {#if error}
    <article class="error">
      {error}
    </article>
  {/if}

  <!-- Loading State -->
  {#if status === 'processing'}
    <article class="info">
      Analyzing CSV file...
    </article>
  {/if}

  <!-- Data Preview -->
  {#if hasData}
    {#if showPreviewWarning}
      <div class="preview-warning">
        Showing first {previewLimit} of {totalRows.toLocaleString()} rows in preview
      </div>
    {/if}

    <div class="data-preview">
      <table>
        <thead>
          <tr class="header-row">
            {#each columns as column}
              <th>
                {column.name}
                <div class="type-info">
                  <select 
                    value={column.suggestedType}
                    on:change={(e) => handleTypeChange(column.name, e.target.value as CsvColumnType)}
                  >
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                    <option value="gps">GPS</option>
                  </select>
                  <span class="confidence">
                    {(column.confidence * 100).toFixed(1)}% confident
                  </span>
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each columns[0]?.sampleValues ?? [] as _, rowIndex}
            <tr>
              {#each columns as column}
                <td class:invalid={column.invalidValues?.includes(column.sampleValues[rowIndex])}>
                  <div class="value-display">
                    <div class="original-value">{column.sampleValues[rowIndex] ?? ''}</div>
                  </div>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button class="secondary" on:click={resetStates}>
        Clear
      </button>
      <button 
        class="primary" 
        on:click={() => goto('/map')}
        disabled={!hasData || status !== 'validated'}
      >
        Proceed to Mapping
      </button>
    </div>
  {/if}
</main>

<style>
  article.error {
    background: var(--del-background-color);
    border-color: var(--del-color);
    color: var(--del-color);
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 0.25rem;
  }

  article.info {
    background: var(--primary-background-color);
    border-color: var(--primary-color);
    color: var(--primary-color);
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 0.25rem;
  }

  .filename {
    margin-left: 1rem;
    color: var(--text-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    border: 1px solid var(--border-color);
  }

  th, td {
    padding: 0.5rem;
    text-align: left;
    border: 1px solid var(--border-color);
  }

  .header-row {
    background: var(--primary);
    color: white;
  }

  .header-row th {
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .type-info {
    font-size: 0.9em;
    margin-top: 0.5rem;
  }

  .confidence {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.7);
    display: block;
    margin-top: 0.25rem;
  }

  td.invalid {
    background-color: var(--del-background-color);
  }

  .preview-warning {
    background: var(--warning-background-color);
    border: 1px solid var(--warning-color);
    color: var(--warning-color);
    padding: 0.5rem;
    margin: 0.5rem 0;
    border-radius: 0.25rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  button {
    min-width: 120px;
  }
</style>
            const analysis = analyzeColumn(values);
            analysis.name = columnName;
            return analysis;
          });

          rawCsvState.csvColumns = analyzedColumns;
          rawCsvState.csvStatus = 'csvtransformed';

          // Start transformation
          transformState.transformedColumns = analyzedColumns;
          transformState.transformStatus = 'transforming';
        },
        error: () => {
          rawCsvState.csvStatus = 'csverror';
        }
      });
    };
    reader.readAsText(file);
  }

  // Function to handle column type changes
  function handleTypeChange(columnName: string, newType: ColumnAnalysis['suggestedType']) {
    transformState.transformations = [
      ...transformState.transformations,
      {
        originalColumn: columnName,
        transformedColumn: columnName,
        transformType: 'convert'
      }
    ];

    transformState.transformedColumns = transformState.transformedColumns.map(col => {
      if (col.name === columnName) {
        return { ...col, suggestedType: newType };
      }
      return col;
    });
  }

  // Function to proceed to mapping
  function proceedToMapping() {
    goto('/TransPlant');
  }
</script>

<main class="container">
  <h1>TransForm - CSV Cleanup</h1>

  <!-- File Upload -->
  <article>
    <input
      type="file"
      accept=".csv"
      bind:this={fileInput}
      on:change={handleFileSelect}
      style="display: none;"
    />
    <button
      class="primary"
      on:click={() => fileInput.click()}
    >
      Upload CSV
    </button>
  </article>

  <!-- Error Display -->
  {#if rawCsvState.csvStatus === 'csverror'}
    <article class="error">
      Error processing CSV file
    </article>
  {/if}

  <!-- Data Preview -->
  {#if hasData}
    {#if showPreviewWarning}
      <div class="preview-warning">
        Showing first {previewLimit} of {rawCsvState.totalRows} rows in preview
      </div>
    {/if}

    <div class="data-preview">
      <table>
        <thead>
          <tr class="header-row">
            {#each rawCsvState.csvColumns as column}
              <th>
                {column.name}
                <div class="type-info">
                  <select 
                    value={column.suggestedType}
                    on:change={(e) => handleTypeChange(column.name, e.target.value)}
                  >
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                  </select>
                  <span class="confidence">
                    {(column.confidence * 100).toFixed(1)}% confident
                  </span>
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each rawCsvState.csvColumns[0]?.sampleValues ?? [] as _, rowIndex}
            <tr>
              {#each rawCsvState.csvColumns as column}
                <td class:invalid={column.invalidValues?.includes(column.sampleValues[rowIndex])}>
                  <div class="value-display">
                    <div class="original-value">{column.sampleValues[rowIndex] ?? ''}</div>
                    {#if column.transformedValues?.[rowIndex]}
                      <div class="transformed-value">{column.transformedValues[rowIndex]}</div>
                    {/if}
                  </div>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button class="secondary" on:click={() => resetStates()}>
        Clear
      </button>
      <button 
        class="primary" 
        on:click={proceedToMapping}
        disabled={transformState.transformStatus !== 'transformed'}
      >
        Proceed to Mapping
      </button>
    </div>
  {/if}
</main>

<style>
  article.error {
    background: var(--del-background-color);
    border-color: var(--del-color);
    color: var(--del-color);
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 0.25rem;
  }

  .container {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    border: 1px solid var(--border-color);
  }

  th, td {
    padding: 0.5rem;
    text-align: left;
    border: 1px solid var(--border-color);
  }

  .header-row {
    background: var(--primary);
    color: white;
  }

  .header-row th {
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .header-row select {
    background: white;
    color: var(--primary);
    border: none;
    padding: 0.25rem;
    border-radius: 0.25rem;
    width: 100%;
  }

  .type-info {
    font-size: 0.9em;
    margin-top: 0.5rem;
  }

  .confidence {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.7);
    display: block;
    margin-top: 0.25rem;
  }

  td.invalid {
    background-color: var(--del-background-color);
  }

  .value-display {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .original-value {
    color: var(--text-color);
  }

  .transformed-value {
    color: var(--success);
    font-size: 0.9em;
  }

  .preview-warning {
    background: var(--warning-background-color);
    border: 1px solid var(--warning-color);
    color: var(--warning-color);
    padding: 0.5rem;
    margin: 0.5rem 0;
    border-radius: 0.25rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  button {
    min-width: 120px;
  }
</style>
