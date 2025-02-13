<script lang="ts">
	import Papa from 'papaparse';
	
	let { onParsed } = $props();

	function parseNumber(value: string) {
		if (!value || value.trim() === '') return '';
		const cleaned = value.replace(/,/g, '');
		return isNaN(Number(cleaned)) ? value : Number(cleaned);
	}

	function handleFileSelect(event: Event) {
		if (typeof window === 'undefined') return;
		const file = (event.target as HTMLInputElement)?.files?.[0];
		if (!file) return;

		Papa.parse(file, {
			header: true,
			dynamicTyping: true,
			transform: parseNumber,
			skipEmptyLines: true,
			complete: (results) => {
				const validData = results.data.filter(row => 
					Object.keys(row as object).length === Object.keys((results.data[0] || {}) as object).length
				);
				onParsed(validData, results.errors || []);
			}
		});
	}
</script>


<input  type="file" accept=".csv" onchange={handleFileSelect} />

