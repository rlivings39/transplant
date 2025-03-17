<script lang="ts">
	import TransferCSVImporter from '$lib/transformComponents/transferCSVImporter.svelte';

	function handleImport(columns: ColumnRep[]) {
		console.log('Imported columns:', columns);
		// Add your data processing logic here
	}
</script>

<TransferCSVImporter onImport={handleImport} />

<style>
	/* Add any necessary styles */
</style>
