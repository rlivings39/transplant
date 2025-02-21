<script lang="ts">
	import ImportTable from '$lib/components/Feb14ImportTable.svelte';
	import CsvImporter from '$lib/components/CsvImporter.svelte';
	import TransformedHeader from '$lib/components/TransformedHeader.svelte';
	import { logger } from '$lib/utils/logger';

	// 3. CENTRAL STATE MANAGER: Holds the main application state
	// 4. Maintains both the CSV data and column type information
	let data = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});

	// Move logging into an effect to properly track changes
	$effect(() => {
		logger.log('ImportTable: columnTypes changed:', $state.snapshot(columnTypes));
		logger.log('ImportTable: current data:', $state.snapshot(data));
	});

	// 5. Receives parsed data from CsvImporter and updates central state
	function handleParsedData(parsedData: Record<string, string>[]) {
		data = parsedData;
		// Initialize columnTypes will be handled by TransformedHeader
	}
	function handleTypeChange(event: CustomEvent<{ header: string; type: string }>) {
		const { header, type } = event.detail;
		columnTypes = { ...columnTypes, [header]: type };
		logger.log(`Type change detected in parent for column: ${header}, new type: ${type}`);
	}
</script>

<div>
	<CsvImporter onParsed={handleParsedData} />

	{#if data.length > 0}
		<TransformedHeader
			headers={Object.keys(data[0])}
			{data}
			bind:columnTypes
			on:typechange={handleTypeChange}
		/>
		<ImportTable {data} {columnTypes} />
	{/if}
</div>
