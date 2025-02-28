<script lang="ts">
	import TransformManager from '$lib/transformComponents/TransformManager.svelte';
	import { goto } from '$app/navigation';
	import { transformedDataService } from '$lib/stores/transformStore';

	// Interface for validated transform data
	interface ValidatedTransformData {
		records: Array<{
			[key: string]: string | number | null;
		}>;
		columnTypes: {
			[key: string]: 'string' | 'number' | 'date' | 'gps' | 'latitude' | 'longitude';
		};
	}

	// Direct scraping function that captures visible table data
	function scrapeAndSendVisibleData() {
		console.log('Starting direct table scraping process');

		// Get all table rows from the DOM (excluding header row)
		const tableRows = document.querySelectorAll('.table-container tbody tr');
		console.log(`Found ${tableRows.length} visible table rows`);

		if (tableRows.length === 0) {
			alert('No visible data found. Please upload and transform data first.');
			return;
		}

		// Get column headers and types from the DOM
		const headerCells = document.querySelectorAll('.table-container thead th');
		const columnHeaders = [];
		const columnTypes = {};

		// Skip the first header cell (GPS column)
		for (let i = 1; i < headerCells.length; i++) {
			const headerCell = headerCells[i];
			const headerName = headerCell.querySelector('.header-name')?.textContent?.trim();

			if (headerName) {
				// Get the selected type from the dropdown
				const typeSelect = headerCell.querySelector('select');
				const type = typeSelect ? typeSelect.value : 'string';

				columnHeaders.push(headerName);
				columnTypes[headerName] = type;
			}
		}

		console.log('Column headers:', columnHeaders);
		console.log('Column types:', columnTypes);

		// Extract data from visible rows
		const records = [];

		tableRows.forEach((row, rowIndex) => {
			const record = {};
			let hasValidData = false;

			// Get all cells in the row (skip the first GPS visualization cell)
			const cells = row.querySelectorAll('td');

			// Start from index 1 to skip GPS visualization cell
			for (let i = 1; i < cells.length; i++) {
				const cell = cells[i];
				const columnHeader = columnHeaders[i - 1];

				// Skip greyed out cells
				if (cell.classList.contains('greyed-out')) {
					continue;
				}

				// Get cell value
				const value = cell.textContent?.trim();

				// Skip empty cells
				if (!value) {
					continue;
				}

				// Add to record
				record[columnHeader] = value;
				hasValidData = true;
			}

			// Only add records with at least one valid field
			if (hasValidData) {
				records.push(record);
			}
		});

		console.log(`Scraped ${records.length} records with visible data`);

		// Create validated data object
		const validatedData: ValidatedTransformData = {
			records: records,
			columnTypes: columnTypes
		};

		// Save to store
		transformedDataService.set(validatedData);
		console.log('Scraped data saved to store:', validatedData);

		// Navigate to TransPlant
		goto('/transplant');
	}

	function pushToTransplant() {
		goto('/transplant');
	}
</script>

<div class="transform-container">
	<div class="transform-header">
		<h1>TransForm Data Import</h1>
	</div>
	<TransformManager />

	<div class="validation-controls">
		<button class="direct-scrape-button" on:click={scrapeAndSendVisibleData}>
			Scrape Visible Data & Send to TransPlant
		</button>
		<p class="help-text">
			This button will scrape only the currently visible (non-greyed out) data from the table and
			send it directly to TransPlant.
		</p>
	</div>
</div>

<style>
	.transform-container {
		width: 100%;
	}

	.transform-header {
		width: 100%;
		padding: 1rem 0;
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.validation-controls {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 4px;
	}

	.direct-scrape-button {
		background-color: #2196f3;
		color: white;
		padding: 10px 15px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
	}

	.direct-scrape-button:hover {
		background-color: #0b7dda;
	}

	.help-text {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #666;
	}
</style>
