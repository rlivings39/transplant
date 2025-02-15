<!-- <script lang="ts">
	import { logger } from '$lib/utils/logger';
	const { headers, data, columnTypes } = $props<{
		headers: string[];
		data: Record<string, string>[];
		columnTypes: Record<string, string>;
	}>();

	let mutableColumnTypes = $state(columnTypes);
	const types = ['date', 'email', 'gps', 'number', 'string', 'url', 'delete'];

	$effect(() => {
		logger.log('Type Detection Started', { dataLength: data.length, headers });
		if (data.length > 0) {
			mutableColumnTypes = Object.fromEntries(
				headers.map((header: string) => {
					// Check first 5 rows for type detection
					const typeCounts: Record<string, number> = {};
					for (let i = 0; i < Math.min(5, data.length); i++) {
						const type = detectType(data[i][header]);
						typeCounts[type] = (typeCounts[type] || 0) + 1;
					}
					// Return the most common type
					return [header, Object.entries(typeCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0]];
				})
			);
		}
	});

	function detectType(value: string): string {
		// Skip empty values
		if (!value || value.trim() === '') return 'string';

		// Check for pure numbers
		if (!isNaN(Number(value)) && !/^\s*$/.test(value)) return 'number';

		// Check for GPS coordinates
		if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(value)) return 'gps';

		// Check for common date formats
		const datePatterns = [
			/^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
			/^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // MM/DD/YY or MM/DD/YYYY
			/^\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}$/, // DD MMM YYYY or DD MMM YY
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, // ISO format
			/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/ // Date with time
		];
		if (datePatterns.some((pattern) => pattern.test(value))) {
			const date = new Date(value);
			if (!isNaN(date.getTime())) return 'date';
		}

		// Check for email and URL
		if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
		if (/^https?:\/\/\S+$/.test(value)) return 'url';

		return 'string';
	}
</script>  -->

<!-- <div class="dropdown-row">
	{#each headers as header}
		<select
			bind:value={mutableColumnTypes[header]}
			onchange={() => {
				logger.log(
					'TransformedHeader: dropdown changed for',
					header,
					'to',
					mutableColumnTypes[header]
				);
			}}
		>
			{#each types as type}
				<option value={type}>{type}</option>
			{/each}
		</select>
	{/each}
</div>
-->