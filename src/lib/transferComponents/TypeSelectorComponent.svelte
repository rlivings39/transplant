<script lang="ts">
	const { columnData = [], currentType = 'string' } = $props<{
		columnData?: Array<string | number | null>;
		currentType?: string;
	}>();

	// Debug: Log incoming column data
	console.log('Received columnData:', columnData);

	const types = ['string', 'number', 'date', 'gps'];

	let detectedType = $state(currentType);

	// 👍️🌲️👍️🌲️👍️🌲️👍️🌲️👍️🌲️NUMBERS🌲️🌲️🌲️🌲️🌲️🌲️🌲️
	// Number detection with debug
	function isNumber(value: any): boolean {
		// Check if value is already a number
		if (typeof value === 'number') {
			return true;
		}

		if (typeof value === 'string') {
			// Remove commas, whitespace, and currency symbols
			const cleaned = value.replace(/[,\s€$£]/g, '').trim();
			// Check if it's a valid number string (including scientific notation)
			return /^-?\d+(\.\d+)?(e-?\d+)?$/.test(cleaned);
		}
		return false;
	}


	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️DATES🌲️🌲️🌲️🌲️🌲️🌲️🌲️
	function isDate(value: any): boolean {
		if (typeof value === 'number') {
			if (1900 < value && 2040 > value) {
			return true;
			} else {
				return false;
			}
		}
		if (typeof value === 'string') {
			const DATE_FORMATS = /^\d{4}-\d{2}-\d{2}$/.test(value);
			return DATE_FORMATS;

			// [
			// 	/^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD (ISO)
			// 	/^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
			// 	/^\d{4}\.\d{2}\.\d{2}$/, // YYYY.MM.DD
			// 	/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i, // Month YYYY
			// 	/^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i, // DD Month YYYY
			// 	/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i, // Month DD, YYYY
			// 	/^\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}$/i, // DD-MMM-YYYY
			// 	/^\d{4}-(?:Q[1-4])$/, // YYYY-Q[1-4] (Quarter)
			// 	/^\d{4}-W(?:0[1-9]|[1-4][0-9]|5[0-3])$/ // YYYY-W[01-53] (ISO week)
			// ];
		}

		return false;
	}

	// ☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️EFFECT☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️
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

	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️GPS🌲️🌲️🌲️🌲️🌲️🌲️🌲️

	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️
</script>

<div class="type-selector">
	<select bind:value={detectedType}>
		{#each types as type}
			<option value={type}>{type}</option>
		{/each}
	</select>
</div>
