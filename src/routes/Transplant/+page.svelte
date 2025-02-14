<script lang="ts">
	import ImportTable from '$lib/components/ImportTable.svelte';
	import CsvImporter from '$lib/components/CsvImporter.svelte';
	import TransformedHeader from '$lib/components/TransformedHeader.svelte';

    let data = $state<Record<string, string>[]>([]);
    let columnTypes = $state<Record<string, string>>({});

    console.log('Page loaded: This is a test log to check console functionality.');
    console.log('ImportTable: columnTypes changed:', $state.snapshot(columnTypes));
    console.log('ImportTable: current data:', $state.snapshot(data));

	function handleParsedData(parsedData: Record<string, string>[]) {
		data = parsedData;
		// Initialize columnTypes will be handled by TransformedHeader
	}
    function handleTypeChange(event: CustomEvent<{ header: string; type: string }>) {
        const { header, type } = event.detail;
        columnTypes[header] = type;
        console.log(`Type change detected in parent for column: ${header}, new type: ${type}`);
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