<script lang="ts">
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
