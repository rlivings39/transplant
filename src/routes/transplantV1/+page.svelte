<!-- <script lang="ts">
	import { logger } from '$lib/utils/logger';
	import Papa from 'papaparse';
	import ColumnRemoval from '$lib/components/ColumnRemoval.svelte';
	// import TransformedHeader from '$lib/components/TransformedHeader.svelte';

	let data = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let removedColumns = $state<Set<string>>(new Set());
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
</script> -->

<!-- <div style="height: 100vh; display: flex; flex-direction: column;"> -->
	<!-- <div style="flex: 0 0 auto;"> 
	<input type="file" accept=".csv" onchange={handleFileSelect} />

	{#if data.length > 0}
		{#if showTable}
			<table
				role="grid"
				onmousemove={(e) => {
					const target = e.target.closest('td, th');
					if (target) {
						target.style.setProperty('--tooltip-x', `${e.clientX}px`);
						target.style.setProperty('--tooltip-y', `${e.clientY}px`);
					}
				}}
			>
				<thead>
					<tr>
						{#each Object.keys(data[0]) as header}
							<th class={removedColumns.has(header) ? 'removed' : ''}>
								<div class="header-text">
									<ColumnRemoval
										{header}
										onToggle={(header, removed) => {
											const newSet = new Set(removedColumns);
											if (removed) {
												newSet.add(header);
											} else {
												newSet.delete(header);
											}
											removedColumns = newSet;
										}}
									/>
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
									<div class="header-text" data-content={header}>
										{header}
									</div>
								</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each transformedData as row}
						<tr>
							{#each Object.keys(row) as key}
								<td class={removedColumns.has(key) ? 'removed' : ''}>
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
			</table>
		{:else}
			<p>Table deleted! Upload a new CSV to start over.</p>
		{/if}
	{/if}
</div> -->

<!-- <style>
    .column-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    :global([title]) {
        position: relative;
        cursor: help;
    }
</style> -->
