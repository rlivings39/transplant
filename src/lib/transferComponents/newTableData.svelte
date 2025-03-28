<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import TypeSelectorComponent from './TypeSelectorComponent.svelte';

	// Import column data
	const { importedData = [] } = $props<{ importedData: ColumnRep[] }>();
	let columnTypes = $state<Record<string, string>>({});

	// function to get column data
	function getColumnData(column: ColumnRep): Array<string | number | null> {
		console.log(`Processing column: ${column.headerName}`);
		// Return the values array directly since it's already part of ColumnRep
		return column.values ?? [];
	}

	// FORMATTING COLUMNS// Number formatting
	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️NUMBERS🌲️🌲️🌲️🌲️🌲️🌲️🌲️
	// the result of isNumber
	// referecne rows by "rowIndex"

	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️DATES🌲️🌲️🌲️🌲️🌲️🌲️🌲️

	function numberFormat(value: number): string {
		// Format numbers with commas as thousand separators
		return new Intl.NumberFormat('en-US', {
			style: 'decimal',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(value);
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
						{#each importedData as column, columnIndex}
							<td class={typeof column.values[rowIndex] === 'number' || 
							            (!isNaN(Number(column.values[rowIndex])) && column.values[rowIndex] !== '') ? 
							            'number-cell' : ''}>
								{typeof column.values[rowIndex] === 'number' || 
								(!isNaN(Number(column.values[rowIndex])) && column.values[rowIndex] !== '') ?
									numberFormat(Number(column.values[rowIndex])) :
									column.values[rowIndex] ?? ''
								}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	<style>
		.number-cell {
			text-align: right;
			padding-right: 1rem;
		}
	</style>
</div>
