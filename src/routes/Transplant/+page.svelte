<script lang="ts">
	import TransplantDataTable from '$lib/transplantComponents/transplantDataTable.svelte';
	import TransplantDbTargetTable from '$lib/transplantComponents/transplantDbTargetTable.svelte';
</script>

<div class="container">
	<h1>Transplant Data</h1>
	<TransplantDataTable />

	<h2>Database Tables</h2>
	<TransplantDbTargetTable />
</div>
