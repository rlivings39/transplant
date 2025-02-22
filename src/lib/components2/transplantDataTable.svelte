<script lang="ts">
	const { data, headers } = $props<{
		data: Record<string, string>[];
		headers: string[];
	}>();
</script>

<div>
	<div class="table-container">
		<table>
			<thead>
				<tr class="header-text">
					{#each headers as header}
						<th>
							<div class="header-name">{header}</div>
						</th>
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
</div>
<!-- 
<style>
	.table-container {
		overflow-x: auto;
		max-width: 100%;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.header-text {
		background-color: #333333;
		color: white;
	}

	.header-name {
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		text-align: left;
	}

	tr:nth-child(even) {
		background-color: var(--surface-color);
	}

	tr td {
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		text-align: left;
	}
</style> -->
