<script lang="ts">
	import { logger } from '$lib/utils/logger';

		// 6. DATA TRANSFORMER: Receives data and columnTypes as props from +page.svelte
	// 7. Will transform this data based on the specified column types
	const { data, columnTypes } = $props<{
		data: Record<string, string>[];
		columnTypes: Record<string, string>;
	}>();

	const transformedData = $state<Record<string, string | number | Date | null>[]>([]);
	let prevData = $state<Record<string, string>[]>([]);
	let prevColumnTypes = $state<Record<string, string>>({});

		// 8. Reactively transforms data whenever data or columnTypes change
	$effect(() => {
		if (data === prevData && columnTypes === prevColumnTypes) return;

		logger.log('ImportTable: columnTypes changed:', $state.snapshot(columnTypes));
		logger.log('ImportTable: current data:', $state.snapshot(data));

		$state.snapshot(transformedData).length = 0;
		transformedData.push(
			...data.map((row: Record<string, string>) => {
				const transformedRow: Record<string, string | number | Date | null> = {};

				for (const [header, type] of Object.entries(columnTypes)) {
					const value = row[header];
					transformedRow[header] = transformValue(value, type);
				}

				return transformedRow;
			})
		);

		prevData = data;
		prevColumnTypes = columnTypes;
	});

	function transformValue(value: string, type: string): string | number | Date | null {
		switch (type) {
			case 'number': {
				const num = parseFloat(value);
				return isNaN(num) ? null : num;
			}
			case 'date': {
				const date = new Date(value);
				return isNaN(date.getTime()) ? null : date;
			}
			case 'gps': {
				const [lat, lon] = value.split(',').map(Number);
				return isNaN(lat) || isNaN(lon) ? null : `${lat.toFixed(6)},${lon.toFixed(6)}`;
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
