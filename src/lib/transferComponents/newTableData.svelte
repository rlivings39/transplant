<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import TypeSelectorComponent from './FormatSelectorComponent.svelte';

	const { importedData = [] } = $props<{ importedData: ColumnRep[] }>();
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

	// Handle format changes
	export function formatEvent(event: CustomEvent<{destinationFormat: string, headerName: string}>) {
		const selectedFormat = event.detail.destinationFormat;
		console.log(`Selected format: ${selectedFormat}`);
		// Update column format in state
		columnFormats[event.detail.headerName] = selectedFormat;
	}

	// FORMATTING COLUMNS// Number formatting
	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️NUMBERS🌲️🌲️🌲️🌲️🌲️🌲️🌲️
	// the result of isNumber
	// referecne rows by "rowIndex"

	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️DATES🌲️🌲️🌲️🌲️🌲️🌲️🌲️

	// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️GPS🌲️🌲️🌲️🌲️🌲️🌲️🌲️
</script>

{#if importedData.length > 0}
	<div class="table-container">
		<div class="type-selector-row">
			{#each importedData as column}
				<TypeSelectorComponent
					columnData={getColumnData(column)}
					currentFormat={columnFormats[column.headerName] || 'string'}
					currentColumnHeader={column.headerName}
					on:formatchange={formatEvent}
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
							<td>
								{columnFormats[column.headerName] === 'number' &&
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
