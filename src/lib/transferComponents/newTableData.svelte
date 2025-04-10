<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';
	import FormatSelectorComponent from './FormatSelectorComponent.svelte';
	import { importedData } from '$lib/transferComponents/modelState.svelte';

	import { formatValue, matchesFormat } from './newFormatDetection';

	// Accept pageIs as a prop
	const { pageIs = 'transfer' } = $props<{ pageIs?: 'transfer' | 'transplant' }>();

	// Derive if we're in transplant mode
	let isTransplant = $derived(pageIs === 'transplant');

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
			{#each importedData.columns.filter((c) => (isTransplant ? c.isToggled : true)) as column}
				<th>
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
					<div class="header-name">{column.headerName}</div>
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each importedData.columns[0].values as _, rowIndex}
			<tr>
				{#each importedData.columns.filter((c) => (isTransplant ? c.isToggled : true)) as column}
					<td
						class={matchesFormat(column.values[rowIndex], column.currentFormat) && column.isToggled
							? ''
							: 'greyed-out'}
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
