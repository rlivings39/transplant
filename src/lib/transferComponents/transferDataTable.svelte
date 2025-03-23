<script lang="ts">
	// import { createEventDispatcher } from 'svelte';
	import type { ColumnRep } from '$lib/types/columnModel';
	import ToggleOff from '.././transformComponents/toggleOff.svelte';
	import GpsColumn from '.././transformComponents/GpsColumn.svelte';

	const { columnRep = $bindable() } = $props<{
		columnRep: ColumnRep[];
	}>();
	function handleColumnTypeChange(columnHeader: string, type: string) {
		columnTypes[columnHeader] = type;
	}

	function isGreyedOut(columnHeader: string, rowIndex: number): boolean {
		return (
			toggledColumns[columnHeader] ||
			!columnTypes[columnHeader] ||
			invalidCells[columnHeader]?.includes(rowIndex)
		);
	}
	$effect(() => {
		console.log('columnRep updated:', $state.snapshot(columnRep));
		console.log('columnTypes:', $state.snapshot(columnTypes));
		console.log('toggledColumns:', $state.snapshot(toggledColumns));
		console.log('invalidCells:', $state.snapshot(invalidCells));
	});
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
								bind:toggled={toggledColumns[column.headerName]}
							/> -->
							<select
								value={columnTypes[column.headerName]}
								onchange={(e) => handleColumnTypeChange(column.headerName, e.currentTarget.value)}
							>
								<option value="string">Text</option>
								<option value="number">Number</option>
								<option value="gps">GPS</option>
								<option value="latitude">Latitude</option>
								<option value="date">Date</option>
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
			{#if columnRep.length > 0}
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
