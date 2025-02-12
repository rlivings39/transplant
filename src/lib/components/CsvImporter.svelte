<script lang="ts">
	import Papa from 'papaparse';
	import { logger } from '$lib/utils/logger';

	let { onParsed } = $props();

	function parseNumber(value: string) {
		// Remove commas and parse as number
		const cleaned = value.replace(/,/g, '');
		return isNaN(Number(cleaned)) ? value : Number(cleaned);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleFileSelect(event: any) {
		const file = event.target?.files?.[0];
		if (!file) return;

		Papa.parse(file, {
			header: true,
			dynamicTyping: true,
			transform: parseNumber, // Add this line
			complete: (results) => {
				logger.info('CSV Parsing Complete', {
					data: results.data,
					fileName: file.name
				});

				if (results.errors?.length) {
					logger.error('CSV Parse Errors', results.errors);
				}

				onParsed(results.data, results.errors || []);
			}
		});
	}
</script>

<input type="file" accept=".csv" onchange={handleFileSelect} />
