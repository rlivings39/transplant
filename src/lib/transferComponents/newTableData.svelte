<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import FormatSelectorComponent from './FormatSelectorComponent.svelte';
	import { importedData } from '$lib/transferComponents/modelState.svelte';

	let columnFormats = $state<Record<string, string>>({});

	// Number formatting function
	function numberFormat(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'decimal',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(value);
	}

	// Get column data
	function getColumnData(column: ColumnRep): Array<string | number | null> {
		console.log(`Processing column: ${column.headerName}`);
		// Return the values array directly since it's already part of ColumnRep
		return column.values ?? [];
	}

	// speculation with 28 Mar 2025  9:47 AM
	// function typeEvent
	// when a user changed a type selector, run detection and formatting for that type on the columnRep
	// then run detection and formatting for that type on the columnRep

	// Whenever select dropdown changes, this updates. Handle format changes
	export function formatEvent(
		event: CustomEvent<{ destinationFormat: string; headerName: string }>
	) {
		// this is dropdown value user chose.
		const selectedFormat = event.detail.destinationFormat;
		console.log(`Called from format event from table: ${selectedFormat}`);
		// Update column format in state
		// might be better to update main model
		columnFormats[event.detail.headerName] = selectedFormat;
		console.log('calling column formats', columnFormats);
	}
</script>

{#if importedData.columns.length > 0}
	<div class="table-container">
		<div class="format-selector-row">
			{#each importedData.columns as column}
				<FormatSelectorComponent
					columnData={getColumnData(column)}
					currentFormat={columnFormats[column.headerName] || 'string'}
					currentColumnHeader={column.headerName}
					onformatchange={formatEvent}
				/>
			{/each}
		</div>
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
							<td>
								{columnFormats[column.headerName] === 'number' &&
								// 3 Apr 2025 9:03 render state rather than raw parced data. 
								// call formatDate, formatNumber etc. 
								typeof column.values[rowIndex] === 'number'
									? numberFormat(column.values[rowIndex] as number)
									: (column.values[rowIndex] ?? '')}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
