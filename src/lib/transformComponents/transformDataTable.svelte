<script lang="ts">
	/* eslint-env browser */
	/// <reference types="svelte" />
	/// <reference lib="dom" />
	import ToggleOff from './toggleOff.svelte';
	import GpsColumn from './GpsColumn.svelte';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		columnTypeChange: { columnHeader: string; type: string };
		columnToggle: { columnHeader: string; isActive: boolean };
	}>();

	const { rows, columnTypes, invalidCells, toggledColumns } = $props<{
		rows: Record<string, any>[];
		columnTypes: Record<string, string>;
		invalidCells: Record<string, Set<number>>;
		toggledColumns: Record<string, boolean>;
	}>();

	// Log the incoming rows data for debugging
	$effect(() => {
		console.log('[transformDataTable] Received rows type:', typeof rows);
		console.log('[transformDataTable] Received rows isArray:', Array.isArray(rows));
		if (Array.isArray(rows) && rows.length > 0) {
			console.log('[transformDataTable] First row sample:', rows[0]);
		}
	});

	// let toggledColumns = $state<Record<string, boolean>>({});

	function handleColumnToggle(columnHeader: string, isActive: boolean) {
		dispatch('columnToggle', { columnHeader, isActive });
	}

	// Ensure rows is always an array
	let safeRows = $derived(Array.isArray(rows) ? rows : []);

	// Log warning if rows is not an array
	$effect(() => {
		if (!Array.isArray(rows)) {
			console.warn('[transformDataTable] rows is not an array:', rows);
		}
	});

	let columnHeaders = $derived(safeRows.length > 0 ? Object.keys(safeRows[0]) : []);
	let previewRows = $derived(safeRows.length > 0 ? safeRows.slice(0, 5000) : []); // Process 5000 rows - better balance of performance and functionality

	function isGreyedOut(columnHeader: string, rowIndex: number): boolean {
		// Column should be greyed out if it's toggled off or has validation errors
		// toggledColumns[columnHeader] is true when column is toggled OFF
		return !!toggledColumns[columnHeader] || invalidCells[columnHeader]?.has(rowIndex);
	}
</script>

<div>
	<div class="header-container">
		<div class="header-actions"></div>
	</div>
	<div class="table-container">
		<table>
			<thead>
				<tr class="header-text">
					<th>
						<div class="header-name">GPS</div>
					</th>
					{#each columnHeaders as columnHeader}
						<th>
							<div class="header-controls">
								<ToggleOff {columnHeader} onToggle={handleColumnToggle} />
								<select
									value={columnTypes[columnHeader]}
									onchange={(e) => {
										dispatch('columnTypeChange', {
											columnHeader,
											type: e.currentTarget.value
										});
									}}
								>
									<option value="string">Text</option>
									<option value="number">Number</option>
									<option value="date">Date</option>
									<option value="gps">GPS</option>
									<option value="latitude">Latitude</option>
									<option value="longitude">Longitude</option>
									<!-- <option value="delete">Delete</option> -->
								</select>
							</div>
							<div class="header-name">
								{columnHeader}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each previewRows as row, rowIndex (rowIndex)}
					<tr>
						<GpsColumn
							{row}
							{columnHeaders}
							{toggledColumns}
							{columnTypes}
							{invalidCells}
							{rowIndex}
						/>
						{#each columnHeaders as columnHeader (columnHeader)}
							<td
								class:number-cell={columnTypes[columnHeader] === 'number'}
								class:coord-cell={columnTypes[columnHeader] === 'latitude' ||
									columnTypes[columnHeader] === 'longitude'}
								class:greyed-out={isGreyedOut(columnHeader, rowIndex)}
							>
								{row[columnHeader]}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
