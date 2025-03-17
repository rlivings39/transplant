<script lang="ts">
    import Papa from 'papaparse';
    import { createEventDispatcher } from 'svelte';
    import type { ColumnRep } from '$lib/types/columnModel';
    import { createColumn } from '$lib/utils/columnUtils';

    let fileInput: HTMLInputElement;
    let isLoading = $state(false);
    let error = $state<string | null>(null);
    
    const dispatch = createEventDispatcher<{
        columnsLoaded: { columns: ColumnRep[] };
        error: string;
    }>();

    function processFile(file: File) {
        isLoading = true;
        error = null;

        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0 || !results.meta.fields) {
                    error = 'CSV parsing errors: ' + (results.errors?.[0]?.message || 'Unknown error');
                    dispatch('error', error);
                    isLoading = false;
                    return;
                }

                // Type-safe column creation
                const columns = results.meta.fields.map(header => {
                    const column = createColumn(header, 'string');
                    column.values = results.data.map(row => row[header]);
                    column.isFormatted = false;
                    column.isToggled = false;
                    return column;
                });

                dispatch('columnsLoaded', { columns });
                isLoading = false;
            },
            error: (err) => {
                error = 'CSV parse failed: ' + err.message;
                dispatch('error', error);
                isLoading = false;
            }
        });
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        if (!event.dataTransfer) return;
        
        const files = event.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'text/csv') {
            processFile(files[0]);
        }
    }

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.[0]) {
            processFile(input.files[0]);
        }
    }
</script>

<!-- Add to transferCSVImporter.svelte -->
<div class="csv-importer" class:loading={isLoading}>
    <div
        class="dropzone"
        class:error={Boolean(error)}
        on:drop={handleDrop}
        on:dragover|preventDefault
        on:dragenter|preventDefault
        role="button"
        tabindex="0"
    >
        {#if isLoading}
            <div class="loading-indicator">Processing CSV...</div>
        {:else if error}
            <div class="error-message">{error}</div>
        {:else}
            <div class="upload-prompt">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <h2>Drop CSV File Here</h2>
                <p>or</p>
                <button class="browse-button" on:click={() => fileInput.click()}>
                    Browse Files
                </button>
            </div>
        {/if}
    </div>

    <input
        type="file"
        accept=".csv"
        on:change={handleFileSelect}
        bind:this={fileInput}
        hidden
    />
</div>

<style>
    .csv-importer {
        margin: 2rem auto;
        max-width: 600px;
    }

    .dropzone {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        transition: border-color 0.2s ease;
    }

    .dropzone:hover {
        border-color: #2196f3;
    }

    .dropzone.error {
        border-color: #ff4444;
    }

    .upload-prompt {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
    }

    .browse-button {
        background: #2196f3;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .loading-indicator {
        color: #2196f3;
    }

    .error-message {
        color: #ff4444;
    }
</style>