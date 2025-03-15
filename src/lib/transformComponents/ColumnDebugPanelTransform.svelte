<script lang="ts">
	import type { Column } from '$lib/types/columnModel';

	// Props
	export let columns: Column[] = [];
	export let isVisible: boolean = true;
	export let maxHeight: string = '400px';

	// Local state
	let selectedColumn: Column | null = null;
	let expandedSections: Record<string, boolean> = {
		basic: true,
		values: false,
		format: false,
		selectTypeCoercion: false
	};

	// Toggle a section's expanded state
	function toggleSection(section: string) {
		expandedSections[section] = !expandedSections[section];
	}

	// Format a value for display
	function formatValue(value: any): string {
		if (value === null || value === undefined) {
			return 'null';
		}

		if (typeof value === 'object') {
			return JSON.stringify(value, null, 2);
		}

		return String(value);
	}

	// Get a truncated preview of array values
	function getArrayPreview(arr: any[]): string {
		if (!arr || arr.length === 0) return '[]';

		const preview = arr
			.slice(0, 3)
			.map((item) => {
				if (item === null || item === undefined) return 'null';
				if (typeof item === 'object') return JSON.stringify(item);
				return String(item);
			})
			.join(', ');

		return `[${preview}${arr.length > 3 ? ', ...' + (arr.length - 3) + ' more' : ''}]`;
	}

	// Get CSS class based on property value type
	function getPropertyClass(value: any): string {
		if (value === null || value === undefined) return 'property-null';
		if (typeof value === 'boolean') return value ? 'property-true' : 'property-false';
		if (typeof value === 'number') return 'property-number';
		if (typeof value === 'string') return 'property-string';
		if (Array.isArray(value)) return 'property-array';
		return 'property-object';
	}
</script>

<div class="column-debug-panel" class:hidden={!isVisible} style="max-height: {maxHeight}">
	<h3>Column Debug Panel</h3>

	<div class="column-selector">
		<label for="column-select">Select Column:</label>
		<select id="column-select" bind:value={selectedColumn}>
			<option value={null}>-- Select a column --</option>
			{#each columns as column}
				<option value={column}>{column.headerName}</option>
			{/each}
		</select>
	</div>

	{#if selectedColumn}
		<div class="column-details">
			<!-- Basic Properties -->
			<div class="property-section">
				<button type="button" class="section-header" onclick={() => toggleSection('basic')}>
					<span class="toggle-icon">{expandedSections.basic ? '▼' : '►'}</span>
					<h5>Basic Properties</h5>
				</button>

				{#if expandedSections.basic}
					<div class="property-list">
						<div class="property-item">
							<span class="property-name">name:</span>
							<span class="property-value property-string">
								"{selectedColumn.headerName}"
							</span>
						</div>
						<div class="property-item">
							<span class="property-name">type:</span>
							<span class="property-value property-string">
								"{selectedColumn.type}"
							</span>
						</div>
						<div class="property-item">
							<span class="property-name">isToggled:</span>
							<span class="property-value {getPropertyClass(selectedColumn.isToggled)}">
								{String(selectedColumn.isToggled)}
							</span>
						</div>
						<div class="property-item">
							<span class="property-name">isFormatted:</span>
							<span class="property-value {getPropertyClass(selectedColumn.isFormatted)}">
								{String(selectedColumn.isFormatted)}
							</span>
						</div>
						{#if selectedColumn.isMapped !== undefined}
							<div class="property-item">
								<span class="property-name">isMapped:</span>
								<span class="property-value {getPropertyClass(selectedColumn.isMapped)}">
									{String(selectedColumn.isMapped || false)}
								</span>
							</div>
							<div class="property-item">
								<span class="property-name">mappedTo:</span>
								<span class="property-value {getPropertyClass(selectedColumn.mappedTo)}">
									{selectedColumn.mappedTo || 'null'}
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Values -->
			<div class="property-section">
				<button type="button" class="section-header" onclick={() => toggleSection('values')}>
					<span class="toggle-icon">{expandedSections.values ? '▼' : '►'}</span>
					<h5>Values ({selectedColumn.values.length})</h5>
				</button>

				{#if expandedSections.values}
					<div class="values-list">
						<table>
							<thead>
								<tr>
									<th>Index</th>
									<th>Value</th>
									<th>Type</th>
								</tr>
							</thead>
							<tbody>
								{#each selectedColumn.values.slice(0, 10) as value, index}
									<tr>
										<td>{index}</td>
										<td
											class={value === null
												? 'null-value'
												: typeof value === 'string'
													? 'string-value'
													: typeof value === 'number'
														? 'number-value'
														: 'other-value'}
										>
											{formatValue(value)}
										</td>
										<td>{value === null ? 'null' : typeof value}</td>
									</tr>
								{/each}
								{#if selectedColumn.values.length > 10}
									<tr>
										<td colspan="3" class="more-values">
											... {selectedColumn.values.length - 10} more values
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Format -->
			{#if selectedColumn.type === 'number' || selectedColumn.type === 'date' || selectedColumn.type === 'gps'}
				<div class="property-section">
					<button type="button" class="section-header" onclick={() => toggleSection('format')}>
						<span class="toggle-icon">{expandedSections.format ? '▼' : '►'}</span>
						<h5>Format</h5>
					</button>

					{#if expandedSections.format}
						<div class="property-list">
							{#if selectedColumn.type === 'number'}
								<div class="property-item">
									<span class="property-name">precision:</span>
									<span class="property-value property-number">
										{(selectedColumn as any).precision || 'auto'}
									</span>
								</div>
							{/if}
							{#if selectedColumn.type === 'date'}
								<div class="property-item">
									<span class="property-name">dateFormat:</span>
									<span class="property-value property-string">
										{(selectedColumn as any).dateFormat || 'auto'}
									</span>
								</div>
							{/if}
							{#if selectedColumn.type === 'gps'}
								<div class="property-item">
									<span class="property-name">gpsFormat:</span>
									<span class="property-value property-string">
										{(selectedColumn as any).gpsFormat || 'decimal'}
									</span>
								</div>
								<div class="property-item">
									<span class="property-name">precision:</span>
									<span class="property-value property-number">
										{(selectedColumn as any).precision || 7}
									</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Type Coercion -->
			{#if selectedColumn.selectTypeCoercion}
				<div class="property-section">
					<button
						type="button"
						class="section-header"
						onclick={() => toggleSection('selectTypeCoercion')}
					>
						<span class="toggle-icon">{expandedSections.selectTypeCoercion ? '▼' : '►'}</span>
						<h5>Type Coercion</h5>
					</button>
					<h5 style="color: white !important;">Test Heading</h5>

					{#if expandedSections.selectTypeCoercion}
						<div class="property-list">
							<div class="property-item">
								<span class="property-name">isCoerced:</span>
								<span
									class="property-value {getPropertyClass(
										selectedColumn.selectTypeCoercion.isCoerced
									)}"
								>
									{String(selectedColumn.selectTypeCoercion.isCoerced)}
								</span>
							</div>
							<div class="property-item">
								<span class="property-name">originalType:</span>
								<span class="property-value property-string">
									"{selectedColumn.selectTypeCoercion.originalType}"
								</span>
							</div>
							<div class="property-item">
								<span class="property-name">coercedTo:</span>
								<span class="property-value property-string">
									"{selectedColumn.selectTypeCoercion.coercedTo}"
								</span>
							</div>
							<div class="property-item">
								<span class="property-name">timestamp:</span>
								<span class="property-value property-number">
									{selectedColumn.selectTypeCoercion.timestamp}
								</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="no-selection">
			<p>Select a column to view its details</p>
		</div>
	{/if}
</div>

<style>
	.column-debug-panel {
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 10px;
		margin-top: 20px;
		overflow-y: auto;
		background-color: var(--color-light-grey);
	}

	.hidden {
		display: none;
	}

	h3 {
		margin-top: 0;
		border-bottom: 1px solid #ddd;
		padding-bottom: 5px;
	}

	.column-selector {
		margin-bottom: 15px;
		background-color: var(--color-light-grey);
	}

	select {
		width: 100%;
		padding: 5px;
		margin-top: 5px;
	}

	.no-selection {
		padding: 20px;
		text-align: center;
		color: #ddd;
	}

	.property-section {
		margin-bottom: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
	}

	.section-header {
		width: 100%;
		text-align: left;
		padding: 8px;
		background-color: var(--color-light-grey);
		border: none;
		color: var(--color-white);
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.section-header h5 {
		margin: 0;
		font-size: 1em;
		color: #666;
	}

	.toggle-icon {
		margin-right: 5px;
		font-size: 0.8em;
	}

	.property-list {
		padding: 10px;
		background-color: var(--color-light-grey);
	}

	.property-item {
		margin-bottom: 5px;
		padding: 5px;
		border-bottom: 1px solid #f0f0f0;
	}

	.property-name {
		font-weight: bold;
		margin-right: 5px;
	}

	.property-value {
		font-family: monospace;
		padding: 2px 4px;
		border-radius: 2px;
	}

	.property-string {
		color: #a31515;
	}

	.property-number {
		color: #098658;
	}

	.property-true {
		color: #0000ff;
	}

	.property-false {
		color: #a31515;
	}

	.property-null {
		color: #666;
		font-style: italic;
	}

	.property-array,
	.property-object {
		color: #881391;
	}

	.values-list {
		max-height: 300px;
		overflow-y: auto;
		padding: 10px;
		background-color: white;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 5px;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	th {
		background-color: var(--color-light-grey);
	}

	.string-value {
		color: #a31515;
	}

	.number-value {
		color: #098658;
	}

	.null-value {
		color: #666;
		font-style: italic;
	}

	.more-values {
		text-align: center;
		color: #666;
		font-style: italic;
	}
</style>
