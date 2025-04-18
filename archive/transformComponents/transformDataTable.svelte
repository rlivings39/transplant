<script lang="ts">
	// import ToggleOff from '../transformComponents/toggleOff.svelte';
	import ToggleOn from './toggleOn.svelte';
	import GpsColumn from './GpsColumn.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	const {
		columnRep = [],
		columnTypes = {},
		invalidCells = {},
		toggledColumns = {}
	} = $props<{
		columnRep?: ColumnRep[];
		columnTypes?: Record<string, string>;
		invalidCells?: Record<string, number[]>;
		toggledColumns?: Record<string, boolean>;
	}>();

	function handleColumnTypeChange(columnHeader: string, type: string) {
		columnTypes[columnHeader] = type;
	}

	function handleColumnToggle(columnHeader: string, isActive: boolean) {
		toggledColumns[columnHeader] = isActive;
	}

	function isGreyedOut(columnHeader: string, rowIndex: number): boolean {
		return !!toggledColumns[columnHeader] || invalidCells[columnHeader]?.includes(rowIndex);
	}
</script>

<div class="table-container">
	<table>
		<thead>
			<tr class="header-text">
				<th>
					<div class="header-name">GPS</div>
				</th>
				{#each columnRep as column}
					<th>
						<div class="header-controls">
							<!-- <ToggleOff 
				  columnHeader={column.headerName} 
				  onToggle={(isActive: boolean) => handleColumnToggle(column.headerName, isActive)}
				/> -->
							<ToggleOn
								columnHeader={column.headerName}
								onToggle={(isActive: boolean) => handleColumnToggle(column.headerName, isActive)}
							/>
							<select
								value={columnTypes[column.headerName]}
								onchange={(e) => handleColumnTypeChange(column.headerName, e.currentTarget.value)}
							>
								<option value="string">Text</option>
								<option value="number">Number</option>
								<option value="date">Date</option>
								<option value="gps">GPS</option>
								<option value="latitude">Latitude</option>
								<option value="longitude">Longitude</option>
							</select>
						</div>
						<div class="header-name">
							{column.headerName}
						</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if columnRep && columnRep.length > 0}
				{#each Array.from({ length: columnRep[0].values.length }, (_, i) => i) as rowIndex}
					<tr>
						<GpsColumn
							row={columnRep.reduce(
								(acc: Record<string, any>, col: ColumnRep) => ({
									...acc,
									[col.headerName]: col.values[rowIndex]
								}),
								{}
							)}
							columnHeaders={columnRep.map((col: ColumnRep) => col.headerName)}
							{toggledColumns}
							{columnTypes}
							{invalidCells}
							{rowIndex}
						/>
						{#each columnRep as column}
							<td
								class:number-cell={columnTypes[column.headerName] === 'number'}
								class:coord-cell={columnTypes[column.headerName] === 'latitude' ||
									columnTypes[column.headerName] === 'longitude'}
								class:greyed-out={isGreyedOut(column.headerName, rowIndex)}
							>
								{column.values[rowIndex] ?? ''}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
