<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import FormatSelectorComponent from './FormatSelectorComponent.svelte';
	import { importedData } from '$lib/transferComponents/modelState.svelte';

	import { formatValue, matchesFormat } from './newFormatDetection';

	let columnFormats = $state<Record<string, string>>({});

	// Number formatting function
	function numberFormat(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'decimal',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(value);
	}

	
	// speculation with 28 Mar 2025  9:47 AM
	// function typeEvent
	// when a user changed a type selector, run detection and formatting for that type on the columnRep
	// then run detection and formatting for that type on the columnRep
</script>

<table>
	<thead>
		<tr>
			{#each importedData.columns as column}
				<th>{column.headerName}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each importedData.columns[0].values as column, rowIndex}
			<tr>
				{#each importedData.columns as column, columnIndex}
					<td
						class={matchesFormat(column.values[rowIndex], column.currentFormat) && column.isToggled ? '' : 'greyed-out'}
					>
						{formatValue(column.currentFormat, column.values[rowIndex])}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
