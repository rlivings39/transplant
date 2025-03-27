<script lang="ts">
	const { columnData = [], currentType = 'string' } = $props<{
		columnData?: Array<string | number | null>;
		currentType?: string;
	}>();

	// Debug: Log incoming column data
	console.log('Received columnData:', columnData);

	const types = ['string', 'number', 'date', 'gps'];

	let detectedType = $state(currentType);

	// Number detection with debug
	function isNumber(value: any): boolean {
		// Check if value is already a number
		if (typeof value === 'number') return true;

		// Strict check for string numbers
		if (typeof value === 'string') {
			// Remove commas, whitespace, and currency symbols
			const cleaned = value.replace(/[,\s€$£]/g, '').trim();
			// Check if it's a valid number string (including scientific notation)
			return /^-?\d+(\.\d+)?(e-?\d+)?$/.test(cleaned);
		}

		return false;
	}

	$effect(() => {
		// Reset detected type for new column
		detectedType = 'string';
		// Get first 3 non-empty values
		const sampleValues = columnData.filter((val) => val !== null && val !== '').slice(0, 3);

		console.log('Checking sample values:', sampleValues);

		// Count numbers in sample
		const numberCount = sampleValues.filter(isNumber).length;

		// If majority are numbers, set type
		if (numberCount >= Math.ceil(sampleValues.length / 2)) {
			if (detectedType !== 'number') {
				console.log(`Setting type to 'number' (${numberCount}/${sampleValues.length} numbers)`);
				detectedType = 'number';
			}
		} else {
			console.log(
				`Insufficient numbers (${numberCount}/${sampleValues.length}) - keeping as '${detectedType}'`
			);
		}
	});
</script>

<div class="type-selector">
	<select bind:value={detectedType}>
		{#each types as type}
			<option value={type}>{type}</option>
		{/each}
	</select>
</div>
