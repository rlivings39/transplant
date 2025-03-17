<script lang="ts">
	/* eslint-env browser */
	/// <reference types="svelte" />
	/// <reference lib="dom" />

	import ToggleComponent from './ToggleComponent.svelte';
	import GpsColumn from './GpsColumn.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	const { columnsPreview } = $props<{
		columnsPreview: ColumnRep[];
	}>();

	const dispatch = createEventDispatcher<{
		columnTypeChange: { columnHeader: string; type: string };
		columnToggle: { columnHeader: string; isActive: boolean };
	}>();

	// const { rows, columnTypes, invalidCells, toggledColumns } = $props<{
	// 	rows: Record<string, any>[];
	// 	columnTypes: Record<string, string>;
	// 	invalidCells: Record<string, Set<number>>;
	// 	toggledColumns: Record<string, boolean>;
	// }>();

	// Log the incoming rows data for debugging
	$effect(() => {
		// console.log('[transformDataTable] Received rows type:', typeof rows);
		// console.log('[transformDataTable] Received rows isArray:', Array.isArray(rows));
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

	let columnHeaders = $derived(columnsPreview.map((col: ColumnRep) => col.headerName));
	let rowCount = $derived(columnsPreview[0]?.values.length || 0);

	function isGreyedOut(columnPreview: ColumnRep, rowIndex: number): boolean {
		return (
			(columnPreview.isToggled ?? false) || (columnPreview.validationErrors?.has(rowIndex) ?? false)
		);
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
					{#each columnsPreview as columnPreview}
						<th>
							<div class="header-controls">
								<ToggleComponent {columnPreview} onToggle={handleColumnToggle} />
								<select
									value={columnPreview.type}
									onchange={(e) => {
										dispatch('columnTypeChange', {
											columnHeader: columnPreview.headerName,
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
								{columnPreview.headerName}
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
						{#each columnsPreview as columnPreview}
							<td class:greyed-out={isGreyedOut(columnPreview, rowIndex)}>
								{row[columnPreview.headerName]}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
