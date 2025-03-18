<script lang="ts">
	// State using Svelte 5 runes
	let rawData = $state<string[][]>([]);
	let columns = $state<Column[]>([]);

	// Ensure transformedData is an array, not a function
	const transformedData = $derived<Record<string, any>[]>(() => {
		return columns.reduce((acc: Record<string, any>[], column) => {
			column.values.forEach((value: string | number | null, index: number) => {
				acc[index] = acc[index] || {};
				acc[index][column.headerName] = value;
			});
			return acc;
		}, []);
	});

	// Table component with proper types
	function Table({ columns, data }: { columns: Column[]; data: Record<string, any>[] }) {
		return `
		<table>
		  <thead>
			<tr>
			  ${columns.map((col) => `<th>${col.headerName}</th>`).join('')}
			</tr>
		  </thead>
		  <tbody>
			${data
				.map(
					(row) => `
			  <tr>
				${columns.map((col) => `<td>${row[col.headerName]}</td>`).join('')}
			  </tr>
			`
				)
				.join('')}
		  </tbody>
		</table>
	  `;
	}
</script>

<!-- Template with proper data passing -->
<div>
	{#if transformedData.length > 0}
		{@html Table({ columns, data: transformedData })}
	{/if}
</div>
