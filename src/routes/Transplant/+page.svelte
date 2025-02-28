<script lang="ts">
    import { onMount } from 'svelte';
    import { transformedDataService } from '$lib/stores/transformStore';

    // Define the TransformedData interface
    interface TransformedData {
        records: Array<Record<string, any>>;
        columnTypes: Record<string, string>;
    }

    // Local state using runes
    let localData = $state<TransformedData | null>(null);
    let dataSource = $state('none');
    let debug = $state('Waiting for data...');

    onMount(() => {
        console.log('Transplant page mounted, checking for data');

        // Get data from service
        const data = transformedDataService.getData();

        if (data) {
            localData = data;
            dataSource = 'store';
            console.log('Found data:', localData);
            debug = 'Data found in store';
        } else {
            console.log('No data found');
            debug = 'No data found. Please go to transform page first.';
        }
    });
</script>

<div class="container">
    <h1>Transplant Data</h1>

    <div class="debug-info">
        <h3>Debug Information</h3>
        <p><strong>Data source:</strong> {dataSource}</p>
        <p><strong>Debug status:</strong> {debug}</p>
        <p><strong>Data available:</strong> {localData ? 'Yes' : 'No'}</p>
        {#if localData}
            <p><strong>Records:</strong> {localData.records?.length || 0}</p>
            <p><strong>Column types:</strong> {Object.keys(localData.columnTypes || {}).length}</p>
        {/if}
    </div>

    {#if localData && localData.records && localData.records.length > 0}
        <table>
            <thead>
                <tr>
                    {#each Object.keys(localData.records[0]) as header}
                        <th>{header} ({localData.columnTypes[header]})</th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each localData.records as record}
                    <tr>
                        {#each Object.keys(record) as key}
                            <td>{record[key]}</td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>

        <div class="data-summary">
            <h3>Data Summary</h3>
            <p>Total records: {localData.records.length}</p>
            <p>Columns: {Object.keys(localData.columnTypes).join(', ')}</p>
        </div>
    {/if}
</div>