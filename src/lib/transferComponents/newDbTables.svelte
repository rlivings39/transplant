<script lang="ts">
	const { landUserTable, plantingUserTable, cropUserTable } = $props<{
		landUserTable: any[];
		plantingUserTable: any[];
		cropUserTable: any[];
	}>();
	const columns = Object.keys(landUserTable[0] || {});
	const plantingColumns = Object.keys(plantingUserTable[0] || {});
	const cropColumns = Object.keys(cropUserTable[0] || {});
</script>

<h3>Planting Table</h3>
<table>
	<thead>
		<tr>
			{#each plantingColumns as column}
				<th>{column}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<tr>
			{#each plantingColumns as column}
				<td></td>
			{/each}
		</tr>
		<tr>
			{#each plantingColumns as column}
				<td></td>
			{/each}
		</tr>
		<tr>
			{#each plantingColumns as column}
				<td></td>
			{/each}
		</tr>
	</tbody>
</table>

<h3>Land Table</h3>
<table>
	<thead>
		<tr>
			{#each columns as column}
				<th>{column}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each landUserTable as row}
			<tr>
				{#each columns as column}
					<td></td>
				{/each}
			</tr>
			<tr>
				{#each columns as column}
					<td></td>
				{/each}
			</tr>
			<tr>
				{#each columns as column}
					<td></td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<h3>Crop Table</h3>
<table>
	<thead>
		<tr>
			{#each cropColumns as column}
				<th>{column}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<tr>
			{#each cropColumns as column}
				<td></td>
			{/each}
		</tr>
		<tr>
			{#each cropColumns as column}
				<td></td>
			{/each}
		</tr>
		<tr>
			{#each cropColumns as column}
				<td></td>
			{/each}
		</tr>
	</tbody>
</table>
