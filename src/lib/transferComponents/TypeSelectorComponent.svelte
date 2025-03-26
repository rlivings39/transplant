<script lang="ts">
	export let columnName: string;
	export let currentType: string = 'string';
	
	const types = ['string', 'number', 'date', 'gps'];
</script>

<div class="type-selector">
	<select value={currentType}>
		{#each types as type}
			<option value={type}>{type}</option>
		{/each}
	</select>
</div>

<style>
	.type-selector {
		padding: 0.25rem;
	}
	
	select {
		width: 100%;
		padding: 0.25rem;
		border-radius: 0.25rem;
	}
</style>