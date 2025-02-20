<script lang="ts">
	import { isValidLatitude, isValidLongitude } from '$lib/utils/gpsUtils';

	let {
		header,
		data,
		type = $bindable<string>('string')
	} = $props<{
		header: string;
		data: Record<string, string>[];
		type?: string;
	}>();

	const types = ['string', 'number', 'date', 'gps', 'latitude', 'longitude', 'delete'];

	// Validate first 5 non-empty values against current type
	function validateForType(values: string[], type: string): boolean {
		let validCount = 0;
		let checkedCount = 0;

		for (const value of values) {
			if (!value?.trim()) continue;

			let isValid = false;
			switch (type) {
				case 'number':
					isValid = !isNaN(parseFloat(value));
					break;
				case 'latitude':
					isValid = isValidLatitude(value);
					break;
				case 'longitude':
					isValid = isValidLongitude(value);
					break;
				case 'gps':
					// Only validate GPS if explicitly selected
					isValid = false;
					break;
				case 'string':
					isValid = true;
					break;
				default:
					isValid = false;
			}

			if (isValid) validCount++;
			if (++checkedCount >= 5) break;
		}

		return validCount === checkedCount;
	}

	// Run validation immediately on load and type changes
	$effect(() => {
		if (!data.length) return;

		const values = data.map((row) => row[header]);
		const isValid = validateForType(values, type);

		if (!isValid) {
			console.log(`Column ${header} failed validation for type ${type}`);
			type = 'string'; // Reset to string if validation fails
		}
	});
</script>

<select bind:value={type}>
	{#each types as typeOption}
		<option value={typeOption}>
			{typeOption === 'delete'
				? 'Delete'
				: typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
		</option>
	{/each}
</select>

<style>
	.coord-type {
		color: var(--primary);
		font-family: 'JetBrains Mono', monospace;
	}

	.coord-type option:not(.coord-option) {
		color: var(--muted);
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		font-style: italic;
	}

	.coord-option {
		color: var(--primary);
		font-family: 'JetBrains Mono', monospace;
	}
</style>
