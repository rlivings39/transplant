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
					<!-- Use index as key -->
					<tr>
						{#each columnHeaders as columnHeader (columnHeader)}
							<!-- Add key here too -->
							<td
								class={toggledColumns[columnHeader] || invalidCells[columnHeader]?.has(rowIndex)
									? 'toggled-off'
									: ''}
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
