<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import TypeSelectorComponent from '../transferComponents/TypeSelectorComponent.svelte';

	// Import column data
	const { importedData = [] } = $props<{ importedData: ColumnRep[] }>();
	let columnTypes = $state<Record<string, string>>({});

	// function to get column data
	function getColumnData(column: ColumnRep): Array<string | number | null> {
		// Debug: Verify column structure
		console.log('Getting data for column:', column.headerName, column);

		// Return the values array directly since it's already part of ColumnRep
		return column.values ?? [];
	}
</script>

<div class="table-container">
	{#if importedData.length > 0}
		<div class="type-selector-row">
			{#each importedData as column}
				<TypeSelectorComponent
					columnData={getColumnData(column)}
					currentType={columnTypes[column.headerName] || 'string'}
				/>
			{/each}
		</div>
		<table>
			<thead>
				<tr>
					{#each importedData as column}
						<th>{column.headerName}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each importedData[0].values as _, rowIndex}
					<tr>
						{#each importedData as column}
							<td>{column.values[rowIndex] ?? ''}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
