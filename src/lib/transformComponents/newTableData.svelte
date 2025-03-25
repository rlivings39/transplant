<script lang="ts">
	import type { ColumnRep } from '$lib/types/columnModel';

	export let importedData: ColumnRep[] = [];
</script>

{#if importedData.length > 0}
	<table>
		<thead>
			<tr>
				{#each importedData as column}
					<th>{column.headerName}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each importedData[0].values as _, rowIndex}
				<tr>
					{#each importedData as column}
						<td>{column.values[rowIndex]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/if}