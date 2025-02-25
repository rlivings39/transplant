<script lang="ts">
	import { onMount } from 'svelte';
	import TransplantDataTable from '$lib/transplantComponents/transplantDataTable.svelte';

	let transformedData = $state([]);
	let headers = $state([]);

	onMount(() => {
		const storedData = sessionStorage.getItem('transformedData');
		if (storedData) {
			try {
				const { data, headers: storedHeaders } = JSON.parse(storedData);
				transformedData = data;
				headers = storedHeaders;
			} catch (error) {
				// // console.error('Error loading data:', error);
			}
		}
	});
</script>

<div class="container">
	<h3>Transformed Data</h3>
	<TransplantDataTable data={transformedData} {headers} />
</div>

<style>
	.container {
		padding: 2rem;
	}
</style>
