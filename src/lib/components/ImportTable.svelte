<script lang="ts">
	  import { logger } from '$lib/utils/logger';

	const { data, columnTypes } = $props<{
		data: Record<string, string>[];
		columnTypes: Record<string, string>;
	}>();
	const transformedData = $state<Record<string, any>[]>([]);
	let prevData = $state<Record<string, string>[]>([]);
	let prevColumnTypes = $state<Record<string, string>>({});

$effect(() => {
  if (data === prevData && columnTypes === prevColumnTypes) return;
  
  logger.log('ImportTable: columnTypes changed:', $state.snapshot(columnTypes));
  logger.log('ImportTable: current data:', $state.snapshot(data));

  $state.snapshot(transformedData).length = 0; // Clear existing data
  transformedData.push(...data.map((row) => {
    const transformedRow: Record<string, any> = {};
    
    for (const [header, type] of Object.entries(columnTypes)) {
      const value = row[header];
      transformedRow[header] = transformValue(value, type);
    }
    
    return transformedRow;
  }));

  prevData = data;
  prevColumnTypes = columnTypes;
});
	function transformValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'date':
        return new Date(value);
		case 'gps':
      const [lat, lon] = value.split(',').map(Number);
      if (isNaN(lat) || isNaN(lon)) return null;
      return `${lat.toFixed(6)},${lon.toFixed(6)}`;
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
