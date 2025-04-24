<script lang="ts">
	import { importedData } from '$lib/transferComponents/modelState.svelte';
	const { landUserTable, plantingUserTable, cropUserTable, dbFormat } = $props<{
		landUserTable: any[];
		plantingUserTable: any[];
		cropUserTable: any[];
		dbFormat: 'string' | 'number' | 'date' | 'gps';
	}>();

	const landColumns = Object.keys(landUserTable[0] || {});
	const plantingColumns = Object.keys(plantingUserTable[0] || {});
	const cropColumns = Object.keys(cropUserTable[0] || {});
	
	interface TableColumn {
		name: string;
		values: unknown[]; // Changed from never[] to unknown[]
	}

	let plantingTable = $state<TableColumn[]>(createColumnState(plantingColumns));
	let landTable = $state<TableColumn[]>(createColumnState(landColumns));
	let cropTable = $state<TableColumn[]>(createColumnState(cropColumns));
	
	function createColumnState(columns: string[]) {
		return columns.map((column) => ({
			name: column,
			values: ['', '', ''],
		}));
	}
	

	// 🌲️🌲️🌳️🌳️🌴️ DRAG DROP THING 🌲️🌲️🌳️🌳️🌴️
	// DONEwrite a function to say when a user clicks a cell, figure out what column it's in.
	// DONEwe need columns to be one unit that's draggable 
	// DONEchange the visual representation of the column
	// DONEuser drags column data to a db table.
	// when they drop data on the db table it needs to:
	     // in state it populate on that attribute on the db table.
		 // in the view it must also populate on that attribute on the db table.
	// we need stat to update on "mapping" property
	// It also need to be normalized trees and land dont repeat
	// 	for planting table it needs to keep the relationship between land and tree(crop)

	$inspect(plantingTable);
	

	function dragoverHandler(ev: DragEvent) {
		ev.preventDefault();
	}
 	
	// 18 Apr 2025 9:02 AM  Get state from top table and update local $state here.
	function dropHandler(ev: DragEvent) {
		if (!ev.dataTransfer || !ev.target) return;
		ev.preventDefault();
		const draggedColumnIndex = Number(ev.dataTransfer.getData('text'));
		const targetColumnIndex = Number((ev.target as HTMLElement).dataset.columnIndex);
		plantingTable[targetColumnIndex].values = importedData.columns[draggedColumnIndex].values;
		// (ev.target as HTMLElement).textContent = 'dropped';
	}


</script>


<h3>Planting Table</h3>
<table>
	<thead>
		<tr>
			{#each plantingTable as column, index}
				<th data-header-name={column.name}
				 data-column-index={index} 
				 ondragover={dragoverHandler} 
				 ondrop={dropHandler}>{column.name}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each plantingTable[0].values as _, rowIndex}
			<tr>
				{#each plantingTable as column, index}
					<td data-header-name={column.name} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}>{column.values[rowIndex]}</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<h3>Land Table</h3>
<table>
	<thead>
		<tr>
			{#each landTable as column, index}
				<th data-header-name={column.name} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}>{column.name}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<!-- {#each landUserTable as column} -->
		<tr>
			{#each landColumns as column, index}
				<td data-header-name={column} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}></td>
			{/each}
		</tr>
		<tr>
			{#each landColumns as column, index}
				<td data-header-name={column} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}></td>
			{/each}
		</tr>
		<tr>
			{#each landColumns as column, index}
				<td data-header-name={column} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}></td>
			{/each}
		</tr>
		<!-- {/each} -->
	</tbody>
</table>

<h3>Crop Table</h3>
<table>
	<thead>
		<tr>
			{#each cropColumns as column, index}
				<th data-header-name={column} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}>{column}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<tr>
			{#each cropColumns as column, index}
				<td data-header-name={column} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}></td>
			{/each}
		</tr>
		<tr>
			{#each cropColumns as column, index}
				<td data-header-name={column} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}></td>
			{/each}
		</tr>
		<tr>
			{#each cropColumns as column, index}
				<td data-header-name={column} data-column-index={index} ondragover={dragoverHandler} ondrop={dropHandler}></td>
			{/each}
		</tr>
	</tbody>
</table>
