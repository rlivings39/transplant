<script lang="ts">
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';

	let transformedData = $state<Record<string, any>[]>([]);
	let invalidCells = $state<Record<string, Set<number>>>({});
	let columnTypes = $state<Record<string, string>>({});

	let columnHeaders = $derived(transformedData.length > 0 ? Object.keys(transformedData[0]) : []);

	function handleTypeChange(event: CustomEvent<{ columnHeader: string; type: string }>) {
		columnTypes = { ...columnTypes, [event.detail.columnHeader]: event.detail.type };
		validateColumns(); // Re-validate after type change
	}

	function handleDataLoaded(event: CustomEvent<{ data: Record<string, string>[] }>) {
		transformedData = cleanData(event.detail.data);

		// Initialize column types
		columnTypes = Object.keys(transformedData[0]).reduce(
			(acc, header) => ({
				...acc,
				[header]: detectColumnType(transformedData.map((row) => row[header]))
			}),
			{}
		);
		validateColumns();
	}

	function detectColumnType(values: string[]): string {
		const sample = values.slice(0, 10).filter(Boolean);

		if (sample.every((v) => !isNaN(Number(v)))) return 'number';
		if (sample.every((v) => !isNaN(Date.parse(v)))) return 'date';
		return 'string'; // Default type
	}

	function cleanValue(value: string): string {
		// Trim and basic normalization
		return value
			.trim()
			.replace(/\s+/g, ' ')
			.replace(/[\u2018\u2019]/g, "'") // Curly quotes
			.replace(/[\u201C\u201D]/g, '"');
	}

	function cleanData(rows: Record<string, string>[]) {
		return rows.map((row) =>
			Object.fromEntries(Object.entries(row).map(([key, val]) => [key, cleanValue(val)]))
		);
	}

	function isValidType(value: string, type: string): boolean {
		if (type === 'number') return !isNaN(Number(value));
		if (type === 'date') return !isNaN(Date.parse(value));
		return true; // Default valid for string type
	}
	function validateColumns() {
		invalidCells = {};
		columnHeaders.forEach((header) => {
			invalidCells[header] = new Set();
			transformedData.forEach((row, index) => {
				if (!isValidType(row[header], columnTypes[header])) {
					invalidCells[header].add(index);
				}
			});
		});
	}
</script>

<div class="transform-manager">
	<CSVImporter on:dataLoaded={handleDataLoaded} />
	{#if transformedData.length > 0}
		<DataPreviewTable
			rows={transformedData}
			{invalidCells}
			{columnTypes}
			on:typeChange={handleTypeChange}
		/>
	{/if}
</div>
