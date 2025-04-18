<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import FormatSelectorComponent from './FormatSelectorComponent.svelte';
	import { importedData } from '$lib/transferComponents/modelState.svelte';

	import { formatValue, matchesFormat } from './newFormatDetection';

	// Add this constant
	const max_transplant_rows = 3;

	// Accept pageIs as a prop
	const { pageIs = 'transfer' } = $props<{ pageIs?: 'transfer' | 'transplant' }>();

	// Derive if we're in transplant mode
	let isTransplant = $derived(pageIs === 'transplant');

	// Number formatting function
	function numberFormat(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'decimal',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(value);
	}

	// 🌲️🌲️🌳️🌳️🌴️ drag drop thing 🌲️🌲️🌳️🌳️🌴️
	// later we need to make the whole column draggable, not just the header 16 Apr 2025  7:56 AM

	function dragstartHandler(ev: DragEvent) {
		if (!ev.dataTransfer) return; // Add this guard
		ev.dataTransfer.setData('text', (ev.target as HTMLElement).id);
	}
</script>

<table>
	<thead>
		<tr>
			{#each importedData.columns.filter((c) => (isTransplant ? c.isToggled : true)) as column, index}
				<th data-header-name={column.headerName} data-column-index={index}>
					<div class="column-header">
						<FormatSelectorComponent
							columnData={column.values}
							currentFormat={column.currentFormat}
							currentColumnHeader={column.headerName}
							onformatchange={(event) => {
								// Update column format directly
								const selectedFormat = event.detail.destinationFormat;
								column.currentFormat = selectedFormat;
								column.isFormatted = true;
							}}
							{isTransplant}
							isToggled={column.isToggled}
						/>
						<div style="height: 0.5rem"></div>
					</div>
					<div
						class="header-name"
						id={column.headerName}
						draggable={true}
						ondragstart={dragstartHandler}
					>
						{column.headerName}
					</div>
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each importedData.columns[0].values.slice(0, isTransplant ? max_transplant_rows : undefined) as _, rowIndex}
			<tr>
				{#each importedData.columns.filter((c) => (isTransplant ? c.isToggled : true)) as column, index}
					<td
						class={matchesFormat(column.values[rowIndex], column.currentFormat) && column.isToggled
							? ''
							: 'greyed-out'}
						data-header-name={column.headerName}
						data-column-index={index}
					>
						{#if isTransplant && (!matchesFormat(column.values[rowIndex], column.currentFormat) || !column.isToggled)}
							<!-- Empty cell when greyed in transplant mode -->
						{:else}
							{formatValue(column.currentFormat, column.values[rowIndex])}
						{/if}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.column-header {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.header-name {
		margin-bottom: 0.5rem;
	}
</style>
