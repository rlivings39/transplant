<script lang="ts">
    import Papa from 'papaparse';
    import { createEventDispatcher } from 'svelte';
    import type { ColumnRep } from '$lib/types/columnModel';
    import { createColumn } from '$lib/utils/columnUtils';

    let fileInput: HTMLInputElement;
    const isLoading = $state(false);
    const error = $state<string | null>(null);
    
    const dispatch = createEventDispatcher<{
        columnsLoaded: { columns: ColumnRep[] };
        error: string;
    }>();

    function processFile(file: File) {
        isLoading = true;
        error = null;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    error = 'CSV parsing errors: ' + results.errors.map(e => e.message).join(', ');
                    dispatch('error', error);
                    return;
                }

                // Create ColumnRep objects according to the Column-based design pattern
                const columns = Object.keys(results.meta.fields || {}).map(header => {
                    const column = createColumn(header, 'string'); // Type will be validated in TransForm
                    column.values = results.data.map(row => row[header]);
                    column.isFormatted = false; // To be formatted by TransForm
                    column.isToggled = false;
                    return column;
                });

                dispatch('columnsLoaded', { columns });
            },
            error: (err) => {
                error = 'CSV parse failed: ' + err.message;
                dispatch('error', error);
            },
            complete: () => {
                isLoading = false;
            }
        });
    }

    // Drag-and-drop handlers and UI similar to CSVImporter but with column-focused events
</script>

<!-- Keep similar drag-and-drop UI from CSVImporter but update event handling -->