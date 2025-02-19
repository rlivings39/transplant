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

	// Import GPS validation from GpsColumn
	import { isValidGpsValue } from './GpsColumn.svelte';

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

	function isGpsColumn(values: string[]): boolean {
		// Get first 5 non-empty values
		const sample = values.filter(Boolean).slice(0, 5);
		if (sample.length === 0) return false;

		// Use shared validation function
		let validCount = 0;
		for (const value of sample) {
			if (isValidGpsValue(value)) {
				validCount++;
			}
		}

		// Consider it a GPS column if most values are valid GPS format
		return validCount / sample.length >= 0.8; // 80% threshold
	}

	function detectType(value: string): string {
		if (/^-?\d+\.?\d*$/.test(value)) return 'number';
		if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/.test(value)) {
			const date = new Date(value);
			if (!isNaN(date.getTime())) return 'date';
		}

		// Check for GPS coordinates
		if (isValidGpsValue(value)) {
			return 'gps';
		}

		// Check for single coordinate (lat or lon)
		const singleCoord = parseFloat(value);
		if (!isNaN(singleCoord) && (Math.abs(singleCoord) <= 90 || Math.abs(singleCoord) <= 180)) {
			return 'gps';
		}

		return 'string';
	}

	function detectColumnType(values: string[]): string {
		const sample = values.slice(0, 10).filter(Boolean);

		// Check for GPS first
		if (isGpsColumn(sample)) return 'gps';

		// Then check other types
		if (sample.every((v) => !isNaN(Number(v)))) return 'number';
		if (sample.every((v) => !isNaN(Date.parse(v)))) return 'date';
		if (sample.every((v) => EMAIL_REGEX.test(v))) return 'email';

		return 'string';
	}
</script>

<select bind:value={type} class:gps-type={type === 'gps'}>
	{#each types as t}
		<option value={t} class:gps-option={t === 'gps'}>{t.toUpperCase()}</option>
	{/each}
</select>

<style>
	.gps-type {
		color: var(--primary);
		font-family: 'JetBrains Mono', monospace;
	}

	.gps-type option:not(.gps-option) {
		color: var(--muted);
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		font-style: italic;
	}

	.gps-option {
		color: var(--primary);
		font-family: 'JetBrains Mono', monospace;
		font-weight: 500;
	}
</style>
