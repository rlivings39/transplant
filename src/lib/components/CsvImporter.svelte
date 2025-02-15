<!-- 
<script lang="ts">
// 1. ENTRY POINT: Handles CSV file upload and parsing using PapaParse
// 2. Uses PapaParse to convert CSV to array of objects
import Papa from 'papaparse';

	let { onParsed } = $props();

	function parseNumber(value: string) {
		if (!value || value.trim() === '') return '';
		const cleaned = value.replace(/,/g, '');
		return isNaN(Number(cleaned)) ? value : Number(cleaned);
	}
function parseDate(value: string) {
  if (!value || value.trim() === '') return '';
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toISOString();
}

function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    transform: (value, field) => {
      // Try parsing as date first, fall back to number parsing
      const dateValue = parseDate(value);
      return dateValue !== value ? dateValue : parseNumber(value);
    },
    skipEmptyLines: true,
    complete: (results) => {
      const validData = results.data.filter(
        (row) =>
          Object.keys(row as object).length ===
          Object.keys((results.data[0] || {}) as object).length
      );
      onParsed(validData, results.errors || []);
    }
  });
}
</script>

<input type="file" accept=".csv" onchange={handleFileSelect} /> -->
