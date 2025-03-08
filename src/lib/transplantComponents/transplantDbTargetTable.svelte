<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { schemaService } from '$lib/services/schemaService';

	// Props from parent
	const { draggedColumn = null } = $props<{
		draggedColumn?: { header: string; columnType: string } | null;
	}>();

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Schema metadata state
	let schemaMetadata = $state<Record<string, any> | null>(null);
	let schemaRelationships = $state<Record<string, any> | null>(null);
	let schemaColumnTypes = $state<Record<string, Record<string, string>> | null>(null);
	let schemaTableHeaders = $state<Record<string, string[]> | null>(null);
	let isSchemaLoading = $state(true);
	let schemaError = $state<string | null>(null);
	let tableNames = $state<string[]>([]);

	// Empty data arrays for each table (4 empty rows)
	const emptyRows = 4;
	let tableData = $state<Record<string, any[]>>({});

	// Mapping state to track which CSV columns are mapped to which table fields
	let mappings = $state<Record<string, string>>({});
	let dragOverField = $state<{ table: string; field: string } | null>(null);

	// Compatible targets for the currently dragged column
	let compatibleTargets = $state<Record<string, string[]>>({});

	// Get data from the transform service
	let transformData = $state<any>(null);

	// Watch for changes to draggedColumn prop
	$effect(() => {
		if (draggedColumn) {
			// Calculate compatible targets for this column type
			updateCompatibleTargets(draggedColumn.columnType);
			console.log(
				`Calculating compatible targets for ${draggedColumn.header} of type ${draggedColumn.columnType}`
			);
		} else {
			// Clear compatible targets when not dragging
			compatibleTargets = {};
		}
	});

	// Function to update compatible targets based on column type
	function updateCompatibleTargets(columnType: string) {
		compatibleTargets = {};

		if (schemaColumnTypes) {
			Object.entries(schemaColumnTypes).forEach(([tableName, columns]) => {
				compatibleTargets[tableName] = [];

				Object.entries(columns).forEach(([fieldName, fieldType]) => {
					if (isTypeCompatible(columnType, fieldType)) {
						compatibleTargets[tableName].push(fieldName);
					}
				});
			});
		}

		console.log(`Column of type ${columnType} can be mapped to:`, compatibleTargets);
	}

	onMount(async () => {
		console.log('TransplantDbTargetTable: Component mounted');

		// Load schema metadata
		try {
			console.log('TransplantDbTargetTable: Loading schema metadata...');
			await schemaService.loadSchemaMetadata();

			// Subscribe to schema data
			const unsubscribeMetadata = schemaService.metadata.subscribe((data) => {
				schemaMetadata = data;
				if (data) {
					tableNames = Object.keys(data);
					console.log(
						'TransplantDbTargetTable: Loaded',
						tableNames.length,
						'tables:',
						tableNames.join(', ')
					);

					// Initialize empty data for each table
					tableNames.forEach((tableName) => {
						if (!tableData[tableName]) {
							tableData[tableName] = Array(emptyRows).fill({});
						}
					});
				} else {
					console.warn('TransplantDbTargetTable: Schema metadata is null or empty');
				}
			});

			const unsubscribeRelationships = schemaService.relationships.subscribe((data) => {
				schemaRelationships = data;
			});

			const unsubscribeColumnTypes = schemaService.columnTypes.subscribe((data) => {
				schemaColumnTypes = data;
			});

			const unsubscribeTableHeaders = schemaService.tableHeaders.subscribe((data) => {
				schemaTableHeaders = data;
			});

			const unsubscribeLoading = schemaService.isLoading.subscribe((loading) => {
				isSchemaLoading = loading;
				if (!loading) {
					console.log('TransplantDbTargetTable: Schema metadata loaded successfully');
				}
			});

			const unsubscribeError = schemaService.error.subscribe((error) => {
				schemaError = error;
				if (error) {
					console.error('TransplantDbTargetTable: Error loading schema metadata:', error);
				}
			});

			// Get data from transform service
			const transformedData = transformedDataService.get();
			if (transformedData) {
				transformData = transformedData;
				console.log('TransplantDbTargetTable: Loaded data from transform service:', transformData);
			} else {
				console.warn('TransplantDbTargetTable: No data available from transform service');
			}

			// Return cleanup function
			return () => {
				unsubscribeMetadata();
				unsubscribeRelationships();
				unsubscribeColumnTypes();
				unsubscribeTableHeaders();
				unsubscribeLoading();
				unsubscribeError();
			};
		} catch (error) {
			console.error('TransplantDbTargetTable: Error in onMount:', error);
			schemaError = error.message || 'Unknown error loading schema metadata';
		}
	});

	// Utility functions
	function isTypeCompatible(sourceType: string, targetType: string): boolean {
		if (!sourceType || !targetType) return false;

		// Normalize types to lowercase for comparison
		const source = sourceType.toLowerCase();
		const target = targetType.toLowerCase();

		// Direct matches
		if (source === target) return true;

		// Special case handling
		switch (source) {
			case 'string':
				// Strings can be mapped to text, varchar, etc.
				return ['text', 'varchar', 'char', 'string'].includes(target);
			case 'number':
				// Numbers can be mapped to numeric types
				return ['int', 'integer', 'decimal', 'numeric', 'float', 'double', 'number'].includes(
					target
				);
			case 'date':
				// Dates can be mapped to date/time types
				return ['date', 'datetime', 'timestamp'].includes(target);
			case 'gps':
				// GPS can be mapped to point or geography types
				return ['point', 'geography', 'geometry', 'gps'].includes(target);
			case 'latitude':
				// Latitude can be mapped to numeric or specific lat types
				return ['float', 'double', 'decimal', 'numeric', 'latitude'].includes(target);
			case 'longitude':
				// Longitude can be mapped to numeric or specific long types
				return ['float', 'double', 'decimal', 'numeric', 'longitude'].includes(target);
			default:
				return false;
		}
	}

	// Drag and drop handlers
	function handleDragOver(event: DragEvent, table: string, field: string) {
		event.preventDefault();

		// Check if this is a compatible target
		const isCompatible = draggedColumn && compatibleTargets[table]?.includes(field);

		if (!isCompatible) {
			event.dataTransfer!.dropEffect = 'none';
			return;
		}

		event.dataTransfer!.dropEffect = 'move';
		dragOverField = { table, field };
	}

	function handleDragLeave() {
		dragOverField = null;
	}

	function handleDrop(event: DragEvent, table: string, field: string) {
		event.preventDefault();
		dragOverField = null;

		const csvColumn = event.dataTransfer?.getData('text/plain');
		if (!csvColumn || !transformData) return;

		console.log(`Dropped ${csvColumn} onto ${table}.${field}`);

		// Get the type of the CSV column - either from draggedColumn prop or from transformData
		const csvColumnType =
			draggedColumn?.header === csvColumn
				? draggedColumn.columnType
				: transformData.columnTypes?.[csvColumn];

		// Get the type of the target database field
		const dbFieldType = schemaColumnTypes?.[table]?.[field];

		// Validate type compatibility
		if (!isTypeCompatible(csvColumnType, dbFieldType)) {
			console.error(`Type mismatch: Cannot map ${csvColumnType} to ${dbFieldType}`);
			// Show error message to user
			const errorMessage = `Type mismatch: Cannot map ${csvColumnType} (${csvColumn}) to ${dbFieldType} (${field})`;
			alert(errorMessage);
			return;
		}

		// Clear any existing mappings to this target field
		Object.entries(mappings).forEach(([col, mapping]) => {
			if (mapping === `${table}.${field}`) {
				delete mappings[col];
			}
		});

		// Create new mapping
		mappings[csvColumn] = `${table}.${field}`;

		// Update the preview data
		updatePreviewData(table, field, csvColumn);

		// Propagate data if needed
		propagateData(table, field, csvColumn);

		// Dispatch event to notify parent component
		dispatch('mappingCreated', {
			csvColumn,
			tableName: table,
			fieldName: field
		});
	}

	// Update preview data based on mappings
	function updatePreviewData(table: string, field: string, csvColumn: string) {
		if (!transformData || !transformData.records) return;

		// Create a copy of the current table data
		const updatedTableData = { ...tableData };

		// Update the field in each row with the corresponding CSV data
		updatedTableData[table] = updatedTableData[table].map((row, index) => {
			if (index < transformData.records.length) {
				return {
					...row,
					[field]: transformData.records[index][csvColumn]
				};
			}
			return row;
		});

		// Update the tableData state
		tableData = updatedTableData;
	}

	// Propagate data to related tables if needed
	function propagateData(table: string, field: string, csvColumn: string) {
		// Implementation for data propagation between tables
		// This would use the schemaRelationships to determine which fields
		// should be propagated to other tables
		console.log(`Propagation for ${table}.${field} not yet implemented`);
	}

	// Helper functions for the UI
	function isFieldMapped(table: string, field: string): boolean {
		return Object.values(mappings).includes(`${table}.${field}`);
	}

	function getMappedColumn(table: string, field: string): string {
		const entry = Object.entries(mappings).find(([_, value]) => value === `${table}.${field}`);
		return entry ? entry[0] : '';
	}

	function formatTypeName(typeName: string): string {
		// Format the type name for display
		if (!typeName) return 'Unknown';
		return typeName.charAt(0).toUpperCase() + typeName.slice(1).toLowerCase();
	}

	function getTableData(tableName: string): any[] {
		return tableData[tableName] || Array(emptyRows).fill({});
	}

	// Function to check if a field is a compatible target for the currently dragged column
	function isCompatibleTarget(table: string, field: string): boolean {
		return compatibleTargets[table]?.includes(field) || false;
	}
</script>

<br />
<br />
{#if isSchemaLoading}
	<div class="loading-indicator">Loading schema metadata...</div>
{:else if schemaError}
	<div class="error-message">
		Error loading schema: {schemaError}
		<button onclick={() => schemaService.loadSchemaMetadata()}>Retry</button>
	</div>
{:else if !schemaTableHeaders || !schemaColumnTypes}
	<div class="error-message">No schema metadata available</div>
{:else}
	<div class="database-tables-container">
		<!-- Debug information -->
		<!-- <div class="debug-info">
			
			{#if Object.keys(mappings).length > 0}
				<p>Current mappings: {Object.keys(mappings).length}</p>
			{/if}
			{#if draggedColumn}
				<p>Dragging: {draggedColumn.header} (Type: {draggedColumn.columnType})</p>
			{/if}
		</div> -->

		{#each tableNames as tableName}
			<div class="table-section">
				<h4 class="table-title">{tableName}</h4>
				<div class="table-container">
					<table>
						<thead>
							<tr>
								{#each schemaTableHeaders[tableName] || [] as header}
									<th
										class={`
											${isFieldMapped(tableName, header) ? 'mapped-field' : ''} 
											${dragOverField?.table === tableName && dragOverField?.field === header ? 'drag-over' : ''} 
											${draggedColumn && isCompatibleTarget(tableName, header) ? 'compatible-target' : ''} 
											${draggedColumn && !isCompatibleTarget(tableName, header) ? 'incompatible-target' : ''}
										`}
										ondragover={(e) => handleDragOver(e, tableName, header)}
										ondragleave={handleDragLeave}
										ondrop={(e) => handleDrop(e, tableName, header)}
									>
										<div class="header-controls">
											<span
												class="type-pseudo-select"
												data-type={formatTypeName(
													schemaColumnTypes[tableName]?.[header] || 'unknown'
												)}
											>
												{formatTypeName(schemaColumnTypes[tableName]?.[header] || 'unknown')}
											</span>
											<span class="header-text">{header}</span>
											{#if isFieldMapped(tableName, header)}
												<span class="mapped-indicator">
													← {getMappedColumn(tableName, header)}
												</span>
											{/if}
										</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each getTableData(tableName) as row, rowIndex}
								<tr>
									{#each schemaTableHeaders[tableName] || [] as header}
										<td>{row[header] || ''}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.database-tables-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.table-section {
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
	}

	.table-title {
		background-color: #f5f5f5;
		padding: 0.5rem 1rem;
		margin: 0;
		border-bottom: 1px solid #ddd;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.5rem;
		border: 1px solid #ddd;
		text-align: left;
		min-width: 12.5rem; /* Fixed width for columns */
	}

	th {
		background-color: #f9f9f9;
		position: relative;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.type-pseudo-select {
		font-size: 0.7rem;
		padding: 0.1rem 0.3rem;
		background-color: #eee;
		border-radius: 3px;
		color: #666;
	}

	.mapped-field {
		background-color: #e6f7ff;
	}

	.mapped-indicator {
		font-size: 0.8rem;
		color: #1890ff;
		margin-left: auto;
	}

	.loading-indicator,
	.error-message {
		padding: 1rem;
		margin: 1rem 0;
		border-radius: 4px;
	}

	.loading-indicator {
		background-color: #f0f0f0;
		color: #666;
	}

	.error-message {
		background-color: #fff1f0;
		color: #f5222d;
		border: 1px solid #ffa39e;
	}

	.debug-info {
		background-color: #f0f0f0;
		padding: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.8rem;
		color: #666;
		border-radius: 4px;
	}

	.drag-over {
		background-color: #e6f7ff;
		border: 2px dashed #1890ff;
	}

	.compatible-target {
		border: 2px dashed #4caf50 !important;
		background-color: rgba(76, 175, 80, 0.1) !important;
	}

	.incompatible-target {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.drag-over.compatible-target {
		background-color: rgba(76, 175, 80, 0.3) !important;
		border: 2px solid #4caf50 !important;
	}
</style>
