<script lang="ts">
	import Papa from 'papaparse';
	import { createEventDispatcher } from 'svelte';

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
			event.currentTarget.classList.add('drag-active');
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		if (event.currentTarget instanceof HTMLElement) {
			event.currentTarget.classList.remove('drag-active');
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

<div class="import-container {isFileLoaded ? 'loaded' : ''}">
	{#if !isFileLoaded}
		<div
			class="dropzone"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			role="button"
			tabindex="0"
			aria-label="Drop CSV file here or click to choose file"
		>
			<input
				type="file"
				accept=".csv"
				onchange={handleFileSelect}
				bind:this={fileInput}
				id="file-input"
				style="display: none;"
			/>
			<div class="dropzone-content">
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
				<button class="simple-button" onclick={() => fileInput.click()}>Upload File</button>
			</div>
		</div>
	{:else}
		<div class="simple-input-container">
			<button class="simple-button" onclick={() => fileInput.click()}>Choose File</button>
			<input
				type="file"
				accept=".csv"
				onchange={handleFileSelect}
				bind:this={fileInput}
				style="display: none;"
			/>
		</div>
	{/if}
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

	.dropzone {
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

	.dropzone:hover,
	.dropzone.drag-active {
		background: rgba(147, 51, 234, 0.1);
	}

	.dropzone-content {
		text-align: center;
		color: #fff;
	}

	.dropzone-content svg {
		margin-bottom: 1rem;
		color: #666;
		transition: color 0.3s ease;
	}

	.dropzone:hover svg,
	.dropzone.drag-active svg {
		color: #9333ea;
	}

	.dropzone-content h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 500;
	}

	.dropzone-content p {
		margin: 0.5rem 0;
		color: #666;
	}

	.simple-button {
		background: transparent;
		color: white;
		border:   solid 2px #7a7281;
		padding: 0.75rem 2rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.simple-button:hover {
		background: rgba(122, 114, 129, 0.1);
	}

	.simple-input-container {
		margin: 1rem 0;
	}
</style>
