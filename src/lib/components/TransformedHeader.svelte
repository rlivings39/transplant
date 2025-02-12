<script lang="ts">
    const { headers, data } = $props<{
        headers: string[],
        data: Record<string, string>[]
    }>();
    
    let columnTypes = $state<Record<string, string>>({});
    const types = ['date', 'email', 'gps', 'number', 'string', 'url'];

    $effect(() => {
        // Auto-detect types when data changes
        if (data.length > 0) {
            columnTypes = Object.fromEntries(
                headers.map(header => [header, detectType(data[0][header])])
            );
        }
    });

    function detectType(value: string): string {
        if (!isNaN(Date.parse(value))) return 'date';
        if (!isNaN(Number(value))) return 'number';
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
        if (/^https?:\/\/\S+$/.test(value)) return 'url';
        if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(value)) return 'gps';
        return 'string';
    }
</script>

<div class="dropdown-row">
    {#each headers as header}
        <select bind:value={columnTypes[header]}>
            {#each types as type}
                <option value={type}>{type}</option>
            {/each}
        </select>
    {/each}
</div>