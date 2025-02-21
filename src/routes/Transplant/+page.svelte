<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="container">
	<header>
		<h2>TransPlant Data Mapping</h2>
		<p>Ready to map your transformed data to the database schema.</p>
	</header>

	<main>
		<!-- Placeholder for our transplant components -->
		<div class="tables-container">
			<p>Transformed data will appear here...</p>
		</div>
	</main>
</div>

<style>
	.container {
		padding: 1rem;
	}

	header {
		margin-bottom: 2rem;
	}

	.tables-container {
		background: var(--background-color);
		padding: 1rem;
		border-radius: 0.25rem;
	}
</style>
