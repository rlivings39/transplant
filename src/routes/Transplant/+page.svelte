<script lang="ts">
    import ImportTable from '$lib/components/ImportTable.svelte';
    import CsvImporter from '$lib/components/CsvImporter.svelte';
    import TransformedHeader from '$lib/components/TransformedHeader.svelte';

    let data = $state<Record<string, string>[]>([]);
    let columnTypes = $state<Record<string, string>>({});

    function handleParsedData(parsedData: Record<string, string>[]) {
        data = parsedData;
        // Initialize columnTypes will be handled by TransformedHeader
    }
</script>

<div>
    <CsvImporter onParsed={handleParsedData} />
    
    {#if data.length > 0}
        <TransformedHeader 
            headers={Object.keys(data[0])} 
            {data}
            bind:columnTypes
        />
        <ImportTable {data} {columnTypes} />
    {/if}
</div>