<script lang="ts">
	// import { createEventDispatcher } from 'svelte';
	import type { ColumnRep } from '$lib/types/columnModel';

	const { columnRep } = $props<{
		columnRep: ColumnRep[];
	}>();

	
</script>

<div class="table-container">
	<table>
		<thead>
			<tr>
				{#each columnRep as columnRep}
					<th>{columnRep.headerName}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if columnRep.length > 0}
				{#each Array.from({ length: columnRep[0].values.length }, (_, i) => i) as rowIndex}
					<tr>
						{#each columnRep as column}
							<td>{column.values[rowIndex] ?? ''}</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
