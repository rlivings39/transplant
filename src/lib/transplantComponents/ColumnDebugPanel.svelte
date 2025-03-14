<script lang="ts">
	import type { Column } from '$lib/types/columnTypes';

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
		dbMapping: false,
		typeCoercion: false
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

	// Extract the actual column name from the prefixed name
	function getCleanColumnName(fullName: string): string {
		// Common prefixes to remove
		const prefixes = ['TextNumberDateGPSLatitudeLongitude', 'TextNumberDateGPS'];

		// Try to remove each prefix
		for (const prefix of prefixes) {
			if (fullName.startsWith(prefix)) {
				// Return the part after the prefix, with the first character lowercase
				const nameWithoutPrefix = fullName.substring(prefix.length);
				// If the name is now empty, return the original name
				if (!nameWithoutPrefix) return fullName;
				// Otherwise, ensure the first character is lowercase for consistency
				return nameWithoutPrefix.charAt(0).toLowerCase() + nameWithoutPrefix.slice(1);
			}
		}

		// If no prefix found, return the original name
		return fullName;
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

	// Get the type of a value for styling
	function getValueType(value: any): string {
		if (value === null || value === undefined) return 'null';
		if (typeof value === 'boolean') return value ? 'true' : 'false';
		return typeof value;
	}
</script>

{#if isVisible}
	<div class="column-debug-panel">
		<div class="panel-header">
			<h3>Column Debug Panel</h3>
			<div class="column-selector">
				<select bind:value={selectedColumn}>
					<option value={null}>-- Select a column --</option>
					{#each columns as column}
						<option value={column}>{getCleanColumnName(column.name)} ({column.type})</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="panel-content" style="max-height: {maxHeight}">
			{#if !selectedColumn && columns.length > 0}
				<div class="columns-overview">
					<h4>Columns Overview ({columns.length})</h4>
					<table>
						<thead>
							<tr>
								<th>Name</th>
								<th>Type</th>
								<th>Toggled</th>
								<th>Formatted</th>
							</tr>
						</thead>
						<tbody>
							{#each columns as column}
								<tr onclick={() => (selectedColumn = column)} style="cursor: pointer;">
									<td>{getCleanColumnName(column.name)}</td>
									<td>{column.type}</td>
									<td>{column.isToggled ? '✓' : '✗'}</td>
									<td>{column.isFormatted ? '✓' : '✗'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else if selectedColumn}
				<div class="column-details">
					<button class="back-button" onclick={() => (selectedColumn = null)}>
						← Back to overview
					</button>

					<!-- Basic Properties -->
					<div class="property-section">
						<button type="button" class="section-header" onclick={() => toggleSection('basic')}>
							<span class="toggle-icon">{expandedSections.basic ? '▼' : '►'}</span>
							<h5>Basic Properties</h5>
						</button>

						{#if expandedSections.basic}
							<div class="property-list">
								<div class="property-item">
									<span class="property-name">Name:</span>
									<span class="property-value">{selectedColumn.name}</span>
								</div>
								<div class="property-item">
									<span class="property-name">Type:</span>
									<span class="property-value">{selectedColumn.type}</span>
								</div>
								<div class="property-item">
									<span class="property-name">Original Name:</span>
									<span class="property-value">{selectedColumn.originalName || 'N/A'}</span>
								</div>
								<div class="property-item">
									<span class="property-name">Is Toggled:</span>
									<span class="property-value property-{selectedColumn.isToggled}"
										>{selectedColumn.isToggled}</span
									>
								</div>
								<div class="property-item">
									<span class="property-name">Is Formatted:</span>
									<span class="property-value property-{selectedColumn.isFormatted}"
										>{selectedColumn.isFormatted}</span
									>
								</div>
								<div class="property-item">
									<span class="property-name">Is Mapped:</span>
									<span class="property-value property-{selectedColumn.isMapped}"
										>{selectedColumn.isMapped}</span
									>
								</div>
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
							<div class="property-list">
								<div class="property-item">
									<span class="property-name">Preview:</span>
									<span class="property-value">{getArrayPreview(selectedColumn.values)}</span>
								</div>

								{#if selectedColumn.values.length > 0}
									<div class="property-item">
										<span class="property-name">First 5 Values:</span>
										<div class="values-list">
											{#each selectedColumn.values.slice(0, 5) as value, i}
												<div class="value-item">
													<span class="value-index">[{i}]:</span>
													<span class="property-value property-{getValueType(value)}"
														>{formatValue(value)}</span
													>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Format -->
					{#if selectedColumn.format}
						<div class="property-section">
							<button type="button" class="section-header" onclick={() => toggleSection('format')}>
								<span class="toggle-icon">{expandedSections.format ? '▼' : '►'}</span>
								<h5>Format</h5>
							</button>

							{#if expandedSections.format}
								<div class="property-list">
									{#each Object.entries(selectedColumn.format) as [key, value]}
										<div class="property-item">
											<span class="property-name">{key}:</span>
											<span class="property-value property-{getValueType(value)}"
												>{formatValue(value)}</span
											>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<!-- DB Mapping -->
					{#if selectedColumn.dbMapping}
						<div class="property-section">
							<button
								type="button"
								class="section-header"
								onclick={() => toggleSection('dbMapping')}
							>
								<span class="toggle-icon">{expandedSections.dbMapping ? '▼' : '►'}</span>
								<h5>DB Mapping</h5>
							</button>

							{#if expandedSections.dbMapping}
								<div class="property-list">
									<div class="property-item">
										<span class="property-name">Table:</span>
										<span class="property-value">{selectedColumn.dbMapping.table || 'N/A'}</span>
									</div>
									<div class="property-item">
										<span class="property-name">Field:</span>
										<span class="property-value">{selectedColumn.dbMapping.field || 'N/A'}</span>
									</div>
									{#if selectedColumn.dbMapping.transformations}
										<div class="property-item">
											<span class="property-name">Transformations:</span>
											<div class="values-list">
												{#each Object.entries(selectedColumn.dbMapping.transformations) as [key, value]}
													<div class="value-item">
														<span class="value-index">{key}:</span>
														<span class="property-value">{formatValue(value)}</span>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Type Coercion -->
					{#if selectedColumn.typeCoercion}
						<div class="property-section">
							<button
								type="button"
								class="section-header"
								onclick={() => toggleSection('typeCoercion')}
							>
								<span class="toggle-icon">{expandedSections.typeCoercion ? '▼' : '►'}</span>
								<h5>Type Coercion</h5>
							</button>

							{#if expandedSections.typeCoercion}
								<div class="property-list">
									<div class="property-item">
										<span class="property-name">Original Type:</span>
										<span class="property-value">{selectedColumn.typeCoercion.originalType}</span>
									</div>
									<div class="property-item">
										<span class="property-name">Target Type:</span>
										<span class="property-value">{selectedColumn.typeCoercion.targetType}</span>
									</div>
									<div class="property-item">
										<span class="property-name">Success Rate:</span>
										<span class="property-value">{selectedColumn.typeCoercion.successRate}%</span>
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
	</div>
{/if}

<style>
	body,
	html,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	p,
	span,
	div,
	th,
	td,
	select,
	label,
	input,
	button,
	.section-header h5,
	.property-null,
	.more-values {
		color: var(--color-white) !important;
	}
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
	}

	select {
		width: 100%;
		padding: 5px;
		margin-top: 5px;
	}

	.no-selection {
		padding: 20px;
		text-align: center;
		color: var(--color-white);
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
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.section-header h5 {
		margin: 0;
		font-size: 1em;
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
		color: #808080;
		font-style: italic;
	}

	.values-list {
		margin-top: 5px;
		border-left: 2px solid #eee;
		padding-left: 10px;
	}

	.value-item {
		margin-bottom: 3px;
	}

	.value-index {
		color: #808080;
		margin-right: 5px;
	}

	.back-button {
		margin-bottom: 10px;
		padding: 5px 10px;
		background-color: var(--color-grey);
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
	}

	.back-button:hover {
		opacity: 0.8;
	}

	.columns-overview {
		overflow-x: auto;
	}

	.columns-overview table {
		width: 100%;
		border-collapse: collapse;
	}

	.columns-overview th,
	.columns-overview td {
		padding: 8px;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	.columns-overview th {
		background-color: var(--color-grey);
	}

	.columns-overview tr:hover {
		opacity: 0.8;
	}

	.panel-content {
		overflow-y: auto;
	}

	.no-columns {
		padding: 20px;
		text-align: center;
		color: var(--color-white);
	}
</style>
