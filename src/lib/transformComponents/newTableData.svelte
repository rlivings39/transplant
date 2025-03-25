<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import TypeSelector from '../transferComponents/TypeSelectorComponent.svelte';

	const { importedData, showTypeSelectors, headers, columnTypes } = $props<ColumnRep[] | null>();
</script>

{#if showTypeSelectors}
  <div class="type-selector-row">
    {#each headers as header}
      <TypeSelector columnName={header} currentType={columnTypes[header] || 'string'} />
    {/each}
  </div>
{/if}
<div class="table-container">
	<table>
		<thead>
			<tr class="header-text">
				<th>
					<div class="header-name">GPS</div>
				</th>
				{#each importedData as column}
					<th>
						<div class="header-name">{column.headerName}</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each importedData[0].values as _, rowIndex}
				<tr>
					{#each importedData as column}
						<td>
							<div class="row-value">{column.values[rowIndex]}</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
