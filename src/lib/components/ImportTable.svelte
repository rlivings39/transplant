<script lang="ts">
	const { data, columnTypes } = $props<{
		data: Record<string, string>[];
		columnTypes: Record<string, string>;
	}>();
	let filteredData = $derived(
		data.map((row) => {
			return Object.fromEntries(
				Object.entries(row).map(([key, value]) => [
					key,
					isMatchingType(value, columnTypes[key]) ? value : '-'
				])
			);
		})
	);

	function isMatchingType(value: string, type: string): boolean {
		switch (type) {
			case 'number':
				return !isNaN(Number(value));
			case 'date':
				// First check if it matches common date formats (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)
				const dateRegex = /^(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})$/;
				if (!dateRegex.test(value)) return false;

				// Then verify it's a valid date (not like 2023-13-45)
				const date = new Date(value);
				return (
					date instanceof Date &&
					!isNaN(date.getTime()) &&
					date.getFullYear() >= 1900 &&
					date.getFullYear() <= 2100
				);
			case 'email':
				return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
			case 'url':
				return /^https?:\/\/\S+$/.test(value);
			default:
				return true;
		}
	}
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
