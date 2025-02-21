<script lang="ts">
	import Papa from 'papaparse';
	import { createEventDispatcher } from 'svelte';

	const { onTransform } = $props<{
		onTransform: () => void;
	}>();

	let rawData = $state<Record<string, string>[]>([]);
	let fileInput: HTMLInputElement;
	let isFileLoaded = $state(false);

	const dispatch = createEventDispatcher<{
		dataLoaded: { data: Record<string, string>[] };
	}>();

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files[0];
		if (file && file.name.toLowerCase().endsWith('.csv')) {
			processFile(file);
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

	function processFile(file: File) {
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				if (results.errors.length > 0) {
					console.error('CSV parsing errors:', results.errors);
				}

				rawData = results.data.filter(
					(row) =>
						Object.keys(row as object).length ===
						Object.keys((results.data[0] || {}) as object).length
				) as Record<string, string>[];

				isFileLoaded = true;
				dispatch('dataLoaded', { data: rawData });
			},
			error: (error) => {
				console.error('CSV parsing failed:', error);
			}
		});
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';

		if (file && file.name.toLowerCase().endsWith('.csv')) {
			processFile(file);
		}
	}
</script>

<div class="import-container">
	{#if !isFileLoaded}
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
				<button class="import-simple-button" onclick={() => fileInput.click()}>Upload File</button>
			</div>
		</div>
	{:else}
		<div class="button-container">
			<div class="import-simple-input-container">
				<button class="import-simple-button" onclick={() => fileInput.click()}>Choose File</button>
			</div>
			<button class="transform-button" onclick={onTransform}>Transform Data</button>
		</div>
	{/if}
	<input
		type="file"
		accept=".csv"
		onchange={handleFileSelect}
		bind:this={fileInput}
		style="display: none;"
	/>
</div>

<style>
	.import-container {
		width: 100%;
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 2rem;
		text-align: center;
	}

	.import-container.loaded {
		text-align: left;
		margin: 1rem 0;
		padding: 0;
	}

	.import-dropzone {
		width: 100%;
		min-height: 300px;
		border: 3px solid #9333ea;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.import-dropzone:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: #a855f7;
	}

	.import-dropzone.import-dropzone--drag-active {
		background: rgba(255, 255, 255, 0.15);
		border-color: #c084fc;
	}

	.import-dropzone-content {
		text-align: center;
	}

	.import-dropzone-content svg {
		color: #9333ea;
		margin-bottom: 1rem;
		transition: color 0.3s ease;
	}

	.import-dropzone:hover svg {
		color: #a855f7;
	}

	.import-dropzone.import-dropzone--drag-active svg {
		color: #c084fc;
	}

	.import-dropzone-content h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #e0e0e0;
	}

	.import-dropzone-content p {
		margin: 0.5rem 0;
		color: #888;
	}

	.import-simple-button,
	.transform-button {
		background: var(--button-background);
		color: var(--button-color);
		border: var(--button-border);
		padding: var(--button-padding);
		border-radius: var(--button-radius);
		font-size: var(--button-font-size);
		cursor: pointer;
		transition: var(--button-transition);
	}

	.import-simple-button:hover,
	.transform-button:hover {
		background: rgba(147, 51, 234, 0.1);
	}

	.button-container {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.import-simple-input-container {
		display: inline-block;
	}
</style>
