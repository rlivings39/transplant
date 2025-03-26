<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import TypeSelector from '../transferComponents/TypeSelectorComponent.svelte';

	const { importedData = [] } = $props<{ importedData: ColumnRep[] }>();
	let columnTypes = $state<Record<string, string>>({});
</script>

<div class="table-container">
	{#if importedData.length > 0}
		<div class="type-selector-row">
			{#each importedData as column}
				<TypeSelector
					columnName={column.headerName}
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
