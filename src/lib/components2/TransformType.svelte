<script lang="ts">
	let {
		header,
		data,
		type = $bindable<string>('string')
	} = $props<{
		header: string;
		data: Record<string, string>[];
		type?: string;
	}>();

	const types = ['string', 'number', 'date', 'gps', 'delete'];

	// Auto-detect type from first 10 non-empty values
	$effect(() => {
		if (data.length === 0) return;

		const typeCounts = new Map<string, number>();
		let samplesChecked = 0;

		for (const row of data) {
			const value = row[header]?.trim();
			if (!value) continue; // Skip empty cells

			const detected = detectType(value);
			typeCounts.set(detected, (typeCounts.get(detected) || 0) + 1);

			if (++samplesChecked >= 10) break;
		}

		if (typeCounts.size > 0) {
			type = Array.from(typeCounts.entries()).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
		}
	});

	function detectType(value: string): string {
		if (/^-?\d+\.?\d*$/.test(value)) return 'number';
		if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/.test(value)) {
			const date = new Date(value);
			if (!isNaN(date.getTime())) return 'date';
		}
		if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(value)) return 'gps';
		return 'string';
	}
	
  function detectColumnType(values: string[]): string {
		const sample = values.slice(0, 10).filter(Boolean);

		if (sample.every((v) => !isNaN(Number(v)))) return 'number';
		if (sample.every((v) => !isNaN(Date.parse(v)))) return 'date';
		if (sample.every((v) => EMAIL_REGEX.test(v))) return 'email';

		return 'string';
	}
</script>

<select bind:value={type}>
	{#each types as t}
		<option value={t}>{t.toUpperCase()}</option>
	{/each}
</select>
