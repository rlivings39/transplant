<script lang="ts">
	import { logger } from '$lib/utils/logger';
	import Papa from 'papaparse';

	let data = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let showTable = $state(true);
	let transformedData = $state<Record<string, string | number | null>[]>([]);

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		Papa.parse(file, {
			header: true,
			complete: (results) => {
				data = results.data as Record<string, string>[];
				columnTypes = Object.fromEntries(Object.keys(data[0]).map((header) => [header, 'string']));
				showTable = true;
				transformData();
			}
		});
	}

	function handleTypeChange(header: string, type: string) {
		columnTypes = { ...columnTypes, [header]: type };
		logger.log(`Type changed for ${header} to ${type}`);
		if (type === 'delete') {
			showTable = false;
		} else {
			transformData();
		}
	}

	function transformData() {
		transformedData = data.map((row) => {
			const transformed: Record<string, string | number | null> = {};
			for (const [key, value] of Object.entries(row)) {
				if (columnTypes[key] === 'number') {
					const num = Number(value.trim());
					transformed[key] = isNaN(num) ? null : num;
				} else {
					transformed[key] = value;
				}
			}
			return transformed;
		});
	}
</script>

<div style="height: 100vh; display: flex; flex-direction: column;">
	<!-- <div style="flex: 0 0 auto;"> -->
	<input type="file" accept=".csv" onchange={handleFileSelect} />


	{#if data.length > 0}
	<!-- <div class="table-container"> -->
			<table>
				{#if showTable}
					<thead>
						<tr>
							{#each Object.keys(data[0]) as header}
								<td>
									<select
										value={columnTypes[header]}
										onchange={(e) => handleTypeChange(header, e.target.value)}
									>
										<option value="string">String</option>
										<option value="number">Number</option>
										<option value="date">Date</option>
										<option value="gps">GPS</option>
										<option value="delete">Delete</option>
									</select>
								</td>
							{/each}
						</tr>
						<tr>
							{#each Object.keys(data[0]) as header}
								<th>{header}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each transformedData as row}
							<tr>
								{#each Object.keys(row) as key}
									<td>
										{#if columnTypes[key] === 'number'}
											{typeof row[key] === 'number' ? row[key] : ''}
										{:else}
											{row[key]}
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				{:else}
					<div>Table deleted! Upload a new CSV to start over.</div>
				{/if}
			</table>
		<!-- </div> -->
	{/if}

</div>