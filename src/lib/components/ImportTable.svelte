<script lang="ts">
	import { logger } from '$lib/utils/logger';

	const { data, columnTypes } = $props<{
		data: Record<string, string>[];
		columnTypes: Record<string, string>;
	}>();

	let transformedData = $state<Record<string, string | number | Date | null>[]>([]);

	// Rebuild table whenever columnTypes change
	$effect(() => {
		if (!data?.length) return;

		transformedData = data.map((row: Record<string, string>) => {
			const transformedRow: Record<string, string | number | Date | null> = {};
			for (const [header, type] of Object.entries(columnTypes)) {
				const value = row[header];
				transformedRow[header] = transformValue(value, type);
			}
			return transformedRow;
		});

		logger.log('Transformed data:', transformedData);
	});

	function transformValue(value: string, type: string): string | number | Date | null {
		if (!value || value.trim() === '') return null;

		switch (type) {
			case 'number': {
				const num = parseFloat(value.replace(/,/g, ''));
				return isNaN(num) ? null : num;
			}
			case 'date': {
				const date = new Date(value);
				return isNaN(date.getTime()) ? null : date;
			}
			case 'gps': {
				const coords = value.split(',').map((v) => parseFloat(v.trim()));
				if (coords.length !== 2 || coords.some(isNaN)) return null;
				return `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
			}
			case 'email':
				return value.toLowerCase();
			case 'url':
				return value.startsWith('http') ? value : `https://${value}`;
			default:
				return value;
		}
	}
</script>

<div class="table-container">
	{#if data?.length > 0}
		<table>
			<thead>
				<tr>
					{#each Object.keys(data[0]) as header}
						<th>{header}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each data as row, i}
					<tr>
						{#each Object.keys(row) as key}
							<td class={typeof transformedData[i]?.[key] === 'number' ? 'numeric' : ''}>
								{transformedData[i]?.[key] ?? row[key]}
								<!-- {/if} -->
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
