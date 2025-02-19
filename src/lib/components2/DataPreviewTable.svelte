<script lang="ts">
	/// <reference types="svelte" />
	import { createEventDispatcher } from 'svelte';
	import type { HTMLSelectElement } from 'svelte/elements';
	import ToggleOff from './toggleOff.svelte';

	let toggledColumns = $state<Record<string, boolean>>({});

	function handleColumnToggle(columnHeader: string, isActive: boolean) {
		// Changed parameter name
		toggledColumns = { ...toggledColumns, [columnHeader]: !isActive };
		console.log('Column toggled:', columnHeader, isActive);
	}

	const { rows, invalidCells, columnTypes } = $props<{
		rows: Record<string, string>[];
		invalidCells: Record<string, Set<number>>;
		columnTypes: Record<string, string>;
	}>();

	// let columnTypes = $state<Record<string, string>>({});
	let columnHeaders = $derived(rows.length > 0 ? Object.keys(rows[0]) : []);
	let previewRows = $derived(rows.slice(0, 500));

	const dispatch = createEventDispatcher<{
		typeChange: { columnHeader: string; type: string }; // Changed from header
	}>();

	function handleTypeChange(columnHeader: string, event: Event) {
		const select = event.target as HTMLSelectElement;
		dispatch('typeChange', { columnHeader, type: select.value });
	}
</script>

<div>
	<div class="table-container">
		<table>
			<thead>
				<tr class="header-text">
					{#each columnHeaders as columnHeader}
						<th>
							<div class="header-controls">
								<ToggleOff {columnHeader} onToggle={handleColumnToggle} />
								<select
									value={columnTypes[columnHeader]}
									on:change={(e) => handleTypeChange(columnHeader, e)}
								>
									<option value="string">Text</option>
									<option value="number">Number</option>
									<option value="date">Date</option>
									<option value="delete">Delete</option>
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
						{#each columnHeaders as columnHeader (columnHeader)}
							<td
								class:number-cell={columnTypes[columnHeader] === 'number'}
								class:toggled-off={toggledColumns[columnHeader] ||
									invalidCells[columnHeader]?.has(rowIndex)}
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

<style>
	.table-container {
		overflow-x: auto;
		max-width: 100%;
	}

	.number-cell {
		text-align: right;
	}

	.toggled-off {
		background-color: rgba(255, 0, 0, 0.2);
	}

	.header-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.header-name {
		font-weight: bold;
	}
</style>
