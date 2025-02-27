<script lang="ts">
	const { data, headers } = $props<{
		data: Record<string, string | number | null>[];
		headers: string[];
	}>();
</script>

<div class="table-container">
	<table>
		<thead>
			<tr>
				{#each headers as header}
					<th style="background: #333333 !important; color: white !important;">
						<div class="header-name">{header}</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data as row}
				<tr>
					{#each headers as header}
						<td>{row[header] ?? ''}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		overflow-x: auto;
		max-width: 100%;
	}

	table {
		border-collapse: collapse;
		margin-bottom: 1rem;
		table-layout: fixed;
	}

	th,
	td {
		width: 12.5rem;
		padding: 0.5rem;
		text-align: left;
		border: 1px solid #ddd;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.header-name {
		padding: 0.25rem;
		font-weight: bold;
	}

	tr:nth-child(even) {
		background-color: #f9f9f9;
	}

	tr:hover {
		background-color: #f5f5f5;
	}
</style>
