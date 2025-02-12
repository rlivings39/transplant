<script lang="ts">
	// import '$lib/styles/tables.css';


	export let data: Record<string, string>[] = [];
</script>

<table>
	{#if data.length > 0}
		<thead>
			<tr>
				{#each Object.keys(data[0]) as header}
					<th>{header}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data as row}
				<tr>
					{#each Object.keys(row) as key}
						<td class={typeof row[key] === 'number' ? 'numeric' : ''}>{row[key]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	{/if}
</table>

