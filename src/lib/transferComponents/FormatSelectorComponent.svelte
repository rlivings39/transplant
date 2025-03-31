<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import { BaseColumnModel } from '$lib/types/columnModel';
	import typeEvent from '$lib/transferComponents/newTableData.svelte';

	const {
		columnData = [],
		currentFormat = 'string',
		currentColumnHeader = '',
		onformatchange = () => {}
	} = $props<{
		columnData?: Array<string | number | null>;
		currentFormat?: string;
		currentColumnHeader?: string;
		onformatchange?: (
			event: CustomEvent<{ destinationFormat: string; headerName: string }>
		) => void;
	}>();

	const formats = ['string', 'number', 'date', 'gps'];

	let selectedFormat = $state(currentFormat);
	let hasUserSelectedFormat = $state(false);

	//  TODO: later once I solve select detect thing, change this function to
	//instead use direcly updating state importedData.columns
	function handleChange(event: Event) {
		hasUserSelectedFormat = true;
		const newFormat = (event.target as HTMLSelectElement).value;
		console.log('Format changed to:', newFormat);
		selectedFormat = newFormat;

		const customEvent = new CustomEvent('formatchange', {
			detail: {
				destinationFormat: newFormat,
				headerName: currentColumnHeader
			},
			bubbles: true
		});
		onformatchange(customEvent);
	} // Here's the key addition - dispatch the event

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
				/^\d{1,2}(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\d{4}$/i
			];
			return DATE_FORMATS.some((format) => format.test(value));
		}
		return false;
	}

	// ☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️EFFECT☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️☀️️
	$effect(() => {
		if (hasUserSelectedFormat) return;
		// Reset detected format for new column
		selectedFormat = 'string';
		// Get first 3 non-empty values
		const sampleValues = columnData
			.filter((val: string | number | null) => val !== null && val !== '')
			.slice(0, 3);
		// console.log('Checking sample values:', sampleValues);
		// Count numbers in sample
		const numberCount = sampleValues.filter(isNumber).length;
		const dateCount = sampleValues.filter(isDate).length;

		// If majority format
		if (dateCount >= Math.ceil(sampleValues.length / 2)) {
			if (selectedFormat !== 'date') {
				// console.log(`Setting format to 'date' (${dateCount}/${sampleValues.length} dates)`);
				selectedFormat = 'date';
			}
		} else if (numberCount >= Math.ceil(sampleValues.length / 2)) {
			if (selectedFormat !== 'number') {
				// console.log(`Setting format to 'number' (${numberCount}/${sampleValues.length} numbers)`);
				selectedFormat = 'number';
			}
		} else {
			console.log(
				`No majority format - keeping as '${selectedFormat}' (${numberCount} numbers, ${dateCount} dates)`
			);
		}
	});

	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️GPS🌲️🌲️🌲️🌲️🌲️🌲️🌲️

	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️
</script>

<!-- <div class="format-selector"> -->
<div class="format-selector">
	<select bind:value={selectedFormat} onchange={handleChange}>
		{#each formats as format}
			<option value={format}>{format}</option>
		{/each}
	</select>
</div>
