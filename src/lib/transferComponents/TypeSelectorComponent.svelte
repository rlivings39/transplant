<script lang="ts">
  import type { ColumnRep } from '$lib/types/columnModel';
	import { BaseColumnModel } from '$lib/types/columnModel';
  

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
			// Check if it's a valid year
			return 1900 < value && value < 2040;
		}
		if (typeof value === 'string') {
			// Check if it's a standalone year
			if (/^\d{4}$/.test(value)) {
				const year = parseInt(value);
				return 1900 < year && year < 2040;
			}

			// Check other date formats
			const DATE_FORMATS = [
				/^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD (ISO)
				/^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
				/^\d{4}\.\d{2}\.\d{2}$/, // YYYY.MM.DD
				/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i, // Month YYYY
				/^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i, // DD Month YYYY
				/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i, // Month DD, YYYY
				/^\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}$/i, // DD-MMM-YYYY
				/^\d{4}-(?:Q[1-4])$/, // YYYY-Q[1-4] (Quarter)
				/^\d{4}-W(?:0[1-9]|[1-4][0-9]|5[0-3])$/, // YYYY-W[01-53] (ISO week)
				/\b(19|20)\d{2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/, // Month YYYY
				/\b(19|20)\d{2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/, // MMM YYYY
				/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i, // MMM YYYY
				/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/, // Month
				/^\d{1,2}(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\d{4}$/i,
			];
			return DATE_FORMATS.some((format) => format.test(value));
		}
		return false;
	}

	// ☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️EFFECT☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️
	$effect(() => {
		// Reset detected type for new column
		detectedType = 'string';
		// Get first 3 non-empty values
		const sampleValues = columnData
			.filter((val: string | number | null) => val !== null && val !== '')
			.slice(0, 3);
		// console.log('Checking sample values:', sampleValues);
		// Count numbers in sample
		const numberCount = sampleValues.filter(isNumber).length;
		const dateCount = sampleValues.filter(isDate).length;

		// If majority type
		if (dateCount >= Math.ceil(sampleValues.length / 2)) {
			if (detectedType !== 'date') {
				// console.log(`Setting type to 'date' (${dateCount}/${sampleValues.length} dates)`);
				detectedType = 'date';
			}
		} else if (numberCount >= Math.ceil(sampleValues.length / 2)) {
			if (detectedType !== 'number') {
				// console.log(`Setting type to 'number' (${numberCount}/${sampleValues.length} numbers)`);
				detectedType = 'number';
			}
		} else {
			console.log(
				`No majority type - keeping as '${detectedType}' (${numberCount} numbers, ${dateCount} dates)`
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
