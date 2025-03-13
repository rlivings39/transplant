<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ToggleSwitch from '$lib/transferComponents/ToggleSwitch.svelte';
	import type { Column, GpsColumn, NumberColumn, DateColumn, StringColumn, GpsCoordinate } from '$lib/types/columnTypes';
	
	// Debug flag to control logging
	const DEBUG = true;
	
	// Logger utility for consistent and controlled logging
	const logger = {
		debug: (message: string, ...args: any[]) => {
			if (DEBUG) console.log(`[TransferDataTable] ${message}`, ...args);
		},
		info: (message: string, ...args: any[]) => {
			console.log(`[TransferDataTable] ${message}`, ...args);
		},
		warn: (message: string, ...args: any[]) => {
			console.warn(`[TransferDataTable] ${message}`, ...args);
		},
		error: (message: string, ...args: any[]) => {
			console.error(`[TransferDataTable] ${message}`, ...args);
		}
	};
	
	// Props
	export let columns: Column[] = [];
	
	// Local state
	let previewRowCount = 5; // Number of rows to show in the preview
	
	// Event dispatcher
	const dispatch = createEventDispatcher();
	
	// Format column type for display
	function formatColumnType(type: string): string {
		if (!type) return 'Unknown';
		return type.charAt(0).toUpperCase() + type.slice(1);
	}
	
	// Format cell value based on column type
	function formatCellValue(column: Column, rowIndex: number): string {
		const value = column.values[rowIndex];
		if (value === null || value === undefined) return '';
		
		// Handle different column types
		switch (column.type) {
			case 'gps':
				const gpsColumn = column as GpsColumn;
				if (typeof value === 'object' && value !== null && 'latitude' in value && 'longitude' in value) {
					const gpsValue = value as GpsCoordinate;
					const lat = Number(gpsValue.latitude);
					const lon = Number(gpsValue.longitude);
					if (!isNaN(lat) && !isNaN(lon)) {
						// Use the column's format settings
						const precision = gpsColumn.format?.precision || 7;
						return `${Number(lat.toFixed(precision))}, ${Number(lon.toFixed(precision))}`;
					}
				}
				return String(value);
			
			case 'number':
				const numberColumn = column as NumberColumn;
				if (typeof value === 'number') {
					// Use the column's format settings
					const precision = numberColumn.format?.precision || 2;
					return Number(value.toFixed(precision)).toString();
				}
				return String(value);
			
			case 'date':
				const dateColumn = column as DateColumn;
				if (value instanceof Date && !isNaN(value.getTime())) {
					// Use the column's format settings
					const dateFormat = dateColumn.format?.dateFormat || 'YYYY-MM-DD';
					// Simple formatting for now
					return value.toISOString().split('T')[0];
				}
				return String(value);
			
			case 'string':
				return String(value);
			
			default:
				return String(value);
		}
	}
	
	// Handle column type change
	function handleColumnTypeChange(columnName: string, newType: 'string' | 'number' | 'date' | 'gps') {
		dispatch('columnTypeChange', { columnName, newType });
	}
	
	// Handle column toggle
	function handleColumnToggle(columnName: string, isToggled: boolean) {
		dispatch('columnToggle', { columnName, isToggled });
	}
	
	// Check if a cell is greyed out
	function isCellGreyedOut(column: Column, rowIndex: number): boolean {
		// If the column is toggled off, all cells are greyed out
		if (!column.isToggled) return true;
		
		// Check cell validation state if it exists
		if (column.cellValidation) {
			const validationState = column.cellValidation.find(v => v.rowIndex === rowIndex);
			if (validationState) {
				return validationState.isGreyedOut;
			}
		}
		
		return false;
	}
	
	// Get CSS class for a cell
	function getCellClass(column: Column, rowIndex: number): string {
		const classes = ['cell'];
		
		// Add type-specific class
		classes.push(`cell-${column.type}`);
		
		// Add greyed-out class if needed
		if (isCellGreyedOut(column, rowIndex)) {
			classes.push('cell-greyed-out');
		}
		
		return classes.join(' ');
	}
</script>

<div class="transfer-data-table">
	<div class="table-container">
		<table>
			<thead>
				<tr class="header-row">
					{#each columns as column}
						<th>
							<div class="header-controls">
								<ToggleSwitch 
									isToggled={column.isToggled} 
									on:toggle={(e: CustomEvent<{isToggled: boolean}>) => handleColumnToggle(column.name, e.detail.isToggled)} 
								/>
								<select
									value={column.type}
									on:change={(e) => handleColumnTypeChange(column.name, e.currentTarget.value as any)}
								>
									<option value="string">Text</option>
									<option value="number">Number</option>
									<option value="date">Date</option>
									<option value="gps">GPS</option>
								</select>
							</div>
							<div class="header-name">
								{column.name}
							</div>
							<div class="header-type">
								{formatColumnType(column.type)}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each Array(Math.min(previewRowCount, columns[0]?.values.length || 0)) as _, rowIndex}
					<tr>
						{#each columns as column}
							<td class={getCellClass(column, rowIndex)}>
								{formatCellValue(column, rowIndex)}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- <style>
	.transfer-data-table {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}
	
	.table-container {
		flex: 1;
		overflow: auto;
		border: 1px solid #ddd;
		border-radius: 4px;
	}
	
	table {
		width: 100%;
		border-collapse: collapse;
	}
	
	th, td {
		padding: 0.5rem;
		border: 1px solid #ddd;
		text-align: left;
	}
	
	th {
		background-color: #f5f5f5;
		position: sticky;
		top: 0;
		z-index: 10;
	}
	
	.header-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}
	
	.header-name {
		font-weight: bold;
		margin-bottom: 0.25rem;
	}
	
	.header-type {
		font-size: 0.8rem;
		color: #666;
	}
	
	select {
		padding: 0.25rem;
		border-radius: 4px;
		border: 1px solid #ddd;
	}
	
	.cell {
		font-family: monospace;
	}
	
	.cell-greyed-out {
		color: #999;
		background-color: #f9f9f9;
	}
	
	.cell-gps {
		color: #2196f3;
	}
	
	.cell-number {
		color: #4caf50;
		text-align: right;
	}
	
	.cell-date {
		color: #ff9800;
	}
</style> -->
