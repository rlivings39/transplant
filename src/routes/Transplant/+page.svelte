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

	// Filter valid data function
	function filterValidData(data: TransformedData): TransformedData {
		if (!data || !data.records || !data.columnTypes) {
			console.log('No data to filter');
			return data;
		}

		console.log('Filtering data with original record count:', data.records.length);

		// Filter out rows with null or undefined values
		const filteredRecords = data.records.filter((record, recordIndex) => {
			console.log(`Checking record ${recordIndex}:`, record);

			// Check each field in the record
			const validFields = Object.entries(record).filter(([key, value]) => {
				// Skip columns that aren't in columnTypes
				if (!data.columnTypes[key]) {
					console.log(`  Field ${key}: No column type defined, accepting`);
					return true;
				}

				// Check if value exists
				if (value === null || value === undefined || value === '') {
					console.log(`  Field ${key}: Empty value, rejecting`);
					return false;
				}

				// For now, accept all values to see what data we have
				console.log(`  Field ${key}: Value ${value}, accepting`);
				return true;
			});

			// Record is valid if it has at least one valid field
			const isValid = validFields.length > 0;
			console.log(
				`Record ${recordIndex} is ${isValid ? 'valid' : 'invalid'} with ${validFields.length} valid fields`
			);
			return isValid;
		});

		console.log('Filtered down to record count:', filteredRecords.length);

		// If we filtered everything, return the original data for debugging
		if (filteredRecords.length === 0) {
			console.log('WARNING: All records were filtered out. Using original data for debugging.');
			return data;
		}

		return {
			records: filteredRecords,
			columnTypes: data.columnTypes
		};
	}

	// Single onMount function that uses filterValidData
	onMount(() => {
		console.log('Transplant page mounted, checking for data');

		// Get data from service
		const rawData = transformedDataService.getData();
		console.log('Raw data received:', rawData);

		if (rawData) {
			console.log('Raw data records:', rawData.records?.length);
			console.log('Raw data column types:', rawData.columnTypes);

			// Filter the data to ensure only valid data is used
			const filteredData = filterValidData(rawData);
			console.log('After filtering - records:', filteredData.records?.length);
			console.log('After filtering - sample record:', filteredData.records?.[0]);

			localData = filteredData;
			dataSource = 'store';
			console.log('Found and filtered data:', localData);
			debug = 'Data found in store and filtered for validity';

			// Check if we have records after setting localData
			console.log('LocalData after assignment:', localData?.records?.length);
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
