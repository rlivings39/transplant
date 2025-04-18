<script lang="ts">
	const { landUserTable, plantingUserTable, cropUserTable, dbFormat } = $props<{
		landUserTable: any[];
		plantingUserTable: any[];
		cropUserTable: any[];
		dbFormat: 'string' | 'number' | 'date' | 'gps';
	}>();
	const landColumns = Object.keys(landUserTable[0] || {});
	const plantingColumns = Object.keys(plantingUserTable[0] || {});
	const cropColumns = Object.keys(cropUserTable[0] || {});

	// 🌲️🌲️🌳️🌳️🌴️ DRAG DROP THING 🌲️🌲️🌳️🌳️🌴️

	function dragoverHandler(ev: DragEvent) {
		ev.preventDefault();
	}

	function dropHandler(ev: DragEvent) {
		if (!ev.dataTransfer || !ev.target) return;
		ev.preventDefault();
		const data = ev.dataTransfer.getData('text');
		(ev.target as HTMLElement).appendChild(document.getElementById(data) as HTMLElement);
	}
</script>

<h1 style="color: red;">{dbFormat}</h1>
<h3>Planting Table</h3>
<table>
	<thead>
		<tr>
			{#each plantingColumns as column}
				<th ondragover={dragoverHandler} ondrop={dropHandler}>{column}</th>
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
			{#each landColumns as column}
				<th>{column}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<!-- {#each landUserTable as column} -->
		<tr>
			{#each landColumns as column}
				<td></td>
			{/each}
		</tr>
		<tr>
			{#each landColumns as column}
				<td></td>
			{/each}
		</tr>
		<tr>
			{#each landColumns as column}
				<td></td>
			{/each}
		</tr>
		<!-- {/each} -->
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
