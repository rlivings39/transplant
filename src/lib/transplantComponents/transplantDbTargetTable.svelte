<script lang="ts">
	import { onMount } from 'svelte';

	// Define table name type
	type TableName = 'Planting' | 'Land' | 'Crop';

	// Define the table headers based on the database schema
	const tableHeaders: Record<TableName, string[]> = {
		Planting: ['id', 'land_id', 'crop_id', 'planted', 'planting_date', 'notes'],
		Land: [
			'land_id',
			'land_name',
			'hectares',
			'land_holder',
			'gps_lat',
			'gps_lon',
			'preparation_id',
			'notes'
		],
		Crop: ['crop_id', 'crop_name', 'species_id', 'crop_stock', 'seedlot', 'seedzone', 'notes']
	};

	// Define column types for each table
	const tableColumnTypes: Record<TableName, Record<string, string>> = {
		Planting: {
			id: 'string',
			land_id: 'string',
			crop_id: 'string',
			planted: 'number',
			planting_date: 'date',
			notes: 'string'
		},
		Land: {
			land_id: 'string',
			land_name: 'string',
			hectares: 'number',
			land_holder: 'string',
			gps_lat: 'latitude',
			gps_lon: 'longitude',
			preparation_id: 'string',
			notes: 'string'
		},
		Crop: {
			crop_id: 'string',
			crop_name: 'string',
			species_id: 'string',
			crop_stock: 'number',
			seedlot: 'string',
			seedzone: 'string',
			notes: 'string'
		}
	};

	// Empty data arrays for each table (3 empty rows)
	const emptyRows = 3;
	let plantingData = Array(emptyRows).fill({});
	let landData = Array(emptyRows).fill({});
	let cropData = Array(emptyRows).fill({});

	// Function to get table data by name
	function getTableData(tableName: TableName): any[] {
		switch (tableName) {
			case 'Planting':
				return plantingData;
			case 'Land':
				return landData;
			case 'Crop':
				return cropData;
			default:
				return [];
		}
	}

	// Function to format type name for display
	function formatTypeName(type: string): string {
		switch (type) {
			case 'string':
				return 'String';
			case 'number':
				return 'Number';
			case 'date':
				return 'Date';
			case 'gps':
				return 'GPS';
			case 'latitude':
				return 'Latitude';
			case 'longitude':
				return 'Longitude';
			default:
				return 'String';
		}
	}
</script>

<br />
<br />
<div class="database-tables-container">
	{#each ['Planting', 'Land', 'Crop'] as tableName}
		<div class="table-section">
			<h4 class="table-title">{tableName}</h4>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							{#each tableHeaders[tableName as TableName] as header}
								<th class={tableName !== 'Planting' ? 'static-table-header' : ''}>
									<div class="header-controls">
										<span
											class="type-pseudo-select"
											data-type={formatTypeName(tableColumnTypes[tableName as TableName][header])}
										>
											{formatTypeName(tableColumnTypes[tableName as TableName][header])}
										</span>
										<span class="header-text">{header}</span>
									</div>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each getTableData(tableName as TableName) as _, rowIndex}
							<tr>
								{#each tableHeaders[tableName as TableName] as header}
									<td></td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/each}
</div>

<style>
	.database-tables-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.table-title {
		margin-bottom: 0.5rem;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.5rem;
		border: 1px solid #ccc;
		min-width: 12.5rem;
	}

	.static-table-header {
		background: #333333 !important;
		color: white !important;
	}

	.header-controls {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.type-pseudo-select {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background-color: #f0f0f0;
		border-radius: 0.25rem;
		font-size: 0.8rem;
		font-weight: bold;
	}

	.type-pseudo-select[data-type='String'] {
		background-color: #e3f2fd;
		color: #0d47a1;
	}

	.type-pseudo-select[data-type='Number'] {
		background-color: #e8f5e9;
		color: #1b5e20;
	}

	.type-pseudo-select[data-type='Date'] {
		background-color: #fff3e0;
		color: #e65100;
	}

	.type-pseudo-select[data-type='GPS'],
	.type-pseudo-select[data-type='Latitude'],
	.type-pseudo-select[data-type='Longitude'] {
		background-color: #f3e5f5;
		color: #4a148c;
	}

	.header-text {
		font-weight: normal;
	}
</style>
