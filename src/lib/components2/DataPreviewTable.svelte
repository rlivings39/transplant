<script lang="ts">
    /// <reference types="svelte" />
    import { createEventDispatcher } from 'svelte';
    import type { HTMLSelectElement } from 'svelte/elements';

    const { data } = $props<{
        data: Record<string, string>[];
    }>();

    let columnTypes = $state<Record<string, string>>({});
    let headers = $derived(data.length > 0 ? Object.keys(data[0]) : []);
    let previewData = $derived(data.slice(0, 500));

    const dispatch = createEventDispatcher<{
        typeChange: { header: string; type: string };
    }>();

    function handleTypeChange(header: string, e: Event) {
        const target = e.target as HTMLSelectElement;
        columnTypes = { ...columnTypes, [header]: target.value };
        dispatch('typeChange', { header, type: target.value });
    }
</script>
<div class="header-text">
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    {#each headers as header}
                        <th>
                            {header}
                            <div class="header-text">
                            <select
                                value={columnTypes[header]}
                                on:change={(e) => handleTypeChange(header, e)}
                            >
                                <option value="string">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="delete">Delete</option>
                            </select>
                            </div>
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each previewData as row}
                    <tr>
                        {#each headers as header}
                            <td>{row[header]}</td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>