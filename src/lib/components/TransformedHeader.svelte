<script lang="ts">
	// The headers from the CSV
	export let headers: string[] = [];
	// The available target fields to map to
	export let targetFields: string[] = [];
</script>

<div class="dropdown-row">
	{#each headers as header}
		<select>
			<option value="">Select</option>
			{#each targetFields as field}
				<option value={field}>{field}</option>
			{/each}
		</select>
	{/each}
</div>

