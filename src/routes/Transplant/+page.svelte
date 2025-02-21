<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TransplantDataTable from '$lib/components2/transplantDataTable.svelte';

	// State management using Svelte 5 runes
	let transformedData = $state([]);
	let headers = $state([]);

	onMount(() => {
		// Load transformed data from sessionStorage
		const storedData = sessionStorage.getItem('transformedData');
		if (!storedData) {
			console.error('No transformed data found');
			goto('/transform');
			return;
		}

		try {
			const { data, headers: storedHeaders } = JSON.parse(storedData);
			transformedData = data;
			headers = storedHeaders;
		} catch (error) {
			console.error('Error loading transformed data:', error);
			goto('/transform');
		}
	});
</script>

<div class="container">
	<header>
		<h2>TransPlant Data Mapping</h2>
		<p>Ready to map your transformed data to the database schema.</p>
	</header>

	<main>
		<div class="tables-container">
			<div class="source-table">
				<h3>Transformed Data</h3>
				<TransplantDataTable data={transformedData} {headers} />
			</div>
		</div>
	</main>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		margin-bottom: 2rem;
	}

	.tables-container {
		background: var(--surface-color);
		padding: 1rem;
		border-radius: 0.25rem;
	}

	.source-table {
		margin-bottom: 2rem;
	}

	h3 {
		margin-bottom: 1rem;
	}
</style>
