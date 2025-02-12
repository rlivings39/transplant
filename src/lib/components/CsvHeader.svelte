<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function updateTable() {
		const newData = [
			{ column1: 'CSV Data 1', column2: 'CSV Data 2' }
			// Add more data as needed
		];
		dispatch('updateTable', newData);
	}
</script>

<div>
	<h3>CSV Header</h3>
	<button onclick={updateTable}>Update Table with CSV Data</button>
</div>
