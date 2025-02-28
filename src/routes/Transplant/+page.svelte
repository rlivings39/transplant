<script>
	import { onMount } from 'svelte';

	// Local state using runes
	let localData = $state(null);
	let dataSource = $state('none');
	let debug = $state('Waiting for data...');

	// Super simple - just access the global variable
	onMount(() => {
		console.log('Transplant page mounted, checking for data');

		// Access the global window.transplantData
		// @ts-ignore - Using global window object
		if (window.transplantData) {
			localData = window.transplantData;
			dataSource = 'global variable';
			console.log('Found data in global variable:', localData);
			debug = 'Data found in global variable';
		} else {
			console.log('No data found in global variable');
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
	{:else}
		<div class="empty-state">
			<p>No transformed data available.</p>
			<a href="/transform" class="button">Go to Transform Page</a>
		</div>
	{/if}
</div>

<style>
	.container {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.debug-info {
		background-color: #f0f8ff;
		padding: 10px;
		border: 1px solid #ccc;
		margin-bottom: 20px;
		font-family: monospace;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	th,
	td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}

	th {
		background-color: #f2f2f2;
		position: sticky;
		top: 0;
	}

	tr:nth-child(even) {
		background-color: #f9f9f9;
	}

	.empty-state {
		text-align: center;
		margin-top: 2rem;
		padding: 2rem;
		background-color: #f9f9f9;
		border-radius: 8px;
	}

	.button {
		display: inline-block;
		background-color: #4caf50;
		color: white;
		padding: 10px 20px;
		text-decoration: none;
		border-radius: 4px;
		margin-top: 1rem;
	}

	.data-summary {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f0f0f0;
		border-radius: 8px;
	}
</style>
