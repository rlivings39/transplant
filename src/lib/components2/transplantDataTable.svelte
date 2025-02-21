<script lang="ts">
	const { data, headers } = $props<{
		data: Record<string, string>[];
		headers: string[];
	}>();
</script>

<div class="data-table">
	<table>
		<thead>
			<tr>
				{#each headers as header}
					<th>{header}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data as row}
				<tr>
					{#each headers as header}
						<td>{row[header]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.data-table {
		overflow-x: auto;
		max-width: 100%;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	th,
	td {
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		text-align: left;
	}

	th {
		background-color: #333333;
		color: white;
	}

	tr:nth-child(even) {
		background-color: var(--surface-color);
	}
</style>
