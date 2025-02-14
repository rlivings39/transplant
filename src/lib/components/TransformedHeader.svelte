<script lang="ts">
	const { headers, data } = $props<{
		headers: string[];
		data: Record<string, string>[];
	}>();

	let columnTypes = $state<Record<string, string>>({});
	const types = ['date', 'email', 'gps', 'number', 'string', 'url'];

	$effect(() => {
		// Auto-detect types when data changes
		if (data.length > 0) {
			columnTypes = Object.fromEntries(
				headers.map((header) => [header, detectType(data[0][header])])
			);
		}
	});

	function detectType(value: string): string {
		// First check if it's a pure number
		if (!isNaN(Number(value)) && !/^\s*$/.test(value)) return 'number';

		// Check for GPS coordinates
		if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(value)) return 'gps';

		// Check for common date formats
		const datePatterns = [
			/^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
			/^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // MM/DD/YY or MM/DD/YYYY
			/^\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}$/ // DD MMM YYYY or DD MMM YY
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
</script>

<div class="dropdown-row">
	{#each headers as header}
		<select 
			bind:value={columnTypes[header]}
			onchange={() => {
				console.log('TransformedHeader: dropdown changed for', header, 'to', columnTypes[header]);
			}}>
			{#each types as type}
				<option value={type}>{type}</option>
			{/each}
		</select>
	{/each}
</div>
