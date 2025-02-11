<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function updateTable() {
		const newData = [
			{ column1: 'Transformed Data 1', column2: 'Transformed Data 2' }
			// Add more data as needed
		];
		dispatch('updateTable', newData);
	}
</script>

<div>
	<h3>Transformed Header</h3>
	<button onclick={updateTable}>Update Table with Transformed Data</button>
</div>
