<script lang="ts">
	import { onMount } from 'svelte';

	// Define the table headers based on the database schema
	const tableHeaders = {
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

	// Empty data arrays for each table (3 empty rows)
	const emptyRows = 3;
	let plantingData = Array(emptyRows).fill({});
	let landData = Array(emptyRows).fill({});
	let cropData = Array(emptyRows).fill({});

	// Function to get table data by name
	function getTableData(tableName: string): any[] {
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
</script>

<br />
<br />
<div class="database-tables-container">
	{#each ['Planting', 'Land', 'Crop'] as tableName}
		<div class="table-section">
			<h4 class="table-title">{tableName} Table</h4>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							{#each tableHeaders[tableName] as header}
								<th class={tableName !== 'Planting' ? 'static-table-header' : ''}>
									{header}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each getTableData(tableName) as _, rowIndex}
							<tr>
								{#each tableHeaders[tableName] as header}
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
