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
				const columns = results.meta.fields.map((header) => {
					const column = createColumn(header, 'string');
					column.values = results.data.map((row) => row[header]);
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
    function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.classList.add('import-dropzone--drag-active');
    }
}

function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.classList.remove('import-dropzone--drag-active');
    }
}
</script>

<div class="import-container" class:loading={isLoading}>
    {#if !isLoading}
        <div
            class="import-dropzone"
            ondrop={handleDrop}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            role="button"
            tabindex="0"
            aria-label="Drop CSV file here or click to choose file"
        >
            <div class="import-dropzone-content">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <h2>Drop your CSV file here</h2>
                <p>or</p>
                <button class="import-simple-button" onclick={() => fileInput.click()}>UPLOAD CSV</button>
            </div>
        </div>
    {:else}
        <div class="loading-indicator">Processing CSV...</div>
    {/if}
    <input
        type="file"
        accept=".csv"
        onchange={handleFileSelect}
        bind:this={fileInput}
        style="display: none;"
    />
</div>