<script lang="ts">
	/// <reference types="svelte" />
	import { createEventDispatcher } from 'svelte';
	import type { HTMLSelectElement } from 'svelte/elements';
	import ToggleOff from './toggleOff.svelte';

	let toggledColumns = $state<Record<string, boolean>>({});

	function handleColumnToggle(columnId: string, isActive: boolean) {
		toggledColumns = { ...toggledColumns, [columnId]: !isActive };
	}

	const { data } = $props<{
		data: Record<string, string>[];
	}>();

	let columnTypes = $state<Record<string, string>>({});
	let headers = $derived(data.length > 0 ? Object.keys(data[0]) : []);
	let previewData = $derived(data.slice(0, 500));

	const dispatch = createEventDispatcher<{
		typeChange: { header: string; type: string };
	}>();

	function handleTypeChange(header: string, e: Event) {
		const target = e.target as HTMLSelectElement;
		columnTypes = { ...columnTypes, [header]: target.value };
		dispatch('typeChange', { header, type: target.value });
	}
</script>

<div>
	<div class="table-container">
		<table>
			<thead>
				<tr class="header-text">
				  {#each headers as header}
				  <th>
					<div class="header-controls">
					  <ToggleOff 
						columnId={header} 
						onToggle={handleColumnToggle}
					  />
					  <select value={columnTypes[header]} onchange={(e) => handleTypeChange(header, e)}>
						<option value="string">Text</option>
						<option value="number">Number</option>
						<option value="date">Date</option>
						<option value="delete">Delete</option>
					  </select>
					</div>
					<div class="header-name">
					  {header}
					</div>
				  </th>
				  {/each}
				</tr>
			  </thead>
			  <tbody>
				{#each previewData as row, i}
				  <tr>
					{#each headers as header}
					  <td class={toggledColumns[header] ? 'toggled-off' : ''}>
						{row[header]}
					  </td>
					{/each}
				  </tr>
				{/each}
			  </tbody>
		</table>
	</div>
</div>
