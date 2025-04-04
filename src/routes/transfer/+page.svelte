<script lang="ts">
	import NewTableData from '$lib/transferComponents/newTableData.svelte';
	import TransferCSVImporter from '$lib/transferComponents/transferCSVImporter.svelte';
	import type { ColumnRep } from '$lib/types/columnModel';
	import { importedData, setImportedData } from '$lib/transferComponents/modelState.svelte';
	import FormatSelectorComponent from '$lib/transferComponents/FormatSelectorComponent.svelte';
	import ToggleComponent from '$lib/transferComponents/ToggleComponent.svelte';

	function handleProcessed(csvImportToPage: ColumnRep[]) {
		setImportedData(csvImportToPage || []);
	}
	// Get column data
	function getColumnData(column: ColumnRep): Array<string | number | null> {
		console.log(`Processing column: ${column.headerName}`);
		// Return the values array directly since it's already part of ColumnRep
		return column.values ?? [];
	}
	// Whenever select dropdown changes, this updates. Handle format changes
	export function formatEvent(
		column: ColumnRep,
		event: CustomEvent<{ destinationFormat: string; headerName: string }>
	) {
		// this is dropdown value user chose.
		const selectedFormat = event.detail.destinationFormat as 'string' | 'number' | 'date' | 'gps';
		console.log(`Called from format event from table: ${selectedFormat}`);
		// Update column format in state
		// might be better to update main model
		column.currentFormat = selectedFormat;
		column.isFormatted = true;
	}
</script>

<TransferCSVImporter onprocessed={handleProcessed} />

{#if importedData.columns.length > 0}
	<div class="table-container">
		<div class="format-selector-row">
			{#each importedData.columns as column}
				<ToggleComponent columnHeader={column.headerName} onToggle={(isActive) => column.isToggled = isActive} />
			{/each}
		</div>

		<div class="format-selector-row">
			{#each importedData.columns as column}
				<FormatSelectorComponent
					columnData={getColumnData(column)}
					currentFormat={column.currentFormat}
					currentColumnHeader={column.headerName}
					onformatchange={(event) => formatEvent(column, event)}
				/>
			{/each}
		</div>

		<NewTableData />
	</div>
{/if}
<button onclick={() => (importedData.columns[0].values[0] = 'Vancouver')}>Change State Test</button>

{#if importedData.columns}
	<h2>Current Column Model State</h2>
	<pre>
		{JSON.stringify(
			importedData.columns.map((col) => ({
				headerName: col.headerName,
				type: col.type,
				currentFormat: col.currentFormat, // Add this
				isToggled: col.isToggled,
				isMapped: col.isMapped,
				mappedTo: col.mappedTo,
				isFormatted: col.isFormatted,
				selectFormatCoercion: col.selectFormatCoercion, // Updated name
				wasFormatCoerced: col.wasFormatCoerced, // Updated name
				values: col.values.slice(0, 3)
			})),
			null,
			2
		)}
	  </pre>
{/if}
