<script lang="ts">
	import { onMount } from 'svelte';
	import { transformedDataService } from '$lib/stores/transformStore';
	import { schemaService } from '$lib/services/schemaService';

	// Schema metadata state
	let schemaMetadata = $state<Record<string, any> | null>(null);
	let schemaRelationships = $state<Record<string, any> | null>(null);
	let schemaColumnTypes = $state<Record<string, Record<string, string>> | null>(null);
	let schemaTableHeaders = $state<Record<string, string[]> | null>(null);
	let isSchemaLoading = $state(true);
	let schemaError = $state<string | null>(null);
	let tableNames = $state<string[]>([]);

	// Empty data arrays for each table (3 empty rows)
	const emptyRows = 3;
	let tableData = $state<Record<string, any[]>>({});

	// Mapping state to track which CSV columns are mapped to which table fields
	let mappings = $state<Record<string, string>>({});
	let dragOverField = $state<{ table: string; field: string } | null>(null);

	// Get data from the transform service
	let transformData = $state<any>(null);

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
					console.log('TransplantDbTargetTable: Schema loading complete');
				}
			});

			const unsubscribeError = schemaService.error.subscribe((err) => {
				if (err) {
					console.error('TransplantDbTargetTable: Schema error:', err);
				}
				schemaError = err;
			});

			// Cleanup subscriptions on component destroy
			return () => {
				unsubscribeMetadata();
				unsubscribeRelationships();
				unsubscribeColumnTypes();
				unsubscribeTableHeaders();
				unsubscribeLoading();
				unsubscribeError();
			};
		} catch (error) {
			console.error('TransplantDbTargetTable: Failed to load schema metadata:', error);
			schemaError = 'Failed to load schema metadata';
		}

		// Load transform data
		const data = transformedDataService.getData();
		if (data) {
			transformData = data;
			console.log(
				'TransplantDbTargetTable: Transform data loaded with',
				data.records ? data.records.length : 0,
				'records'
			);
		} else {
			console.log('TransplantDbTargetTable: No transform data available');
		}
	});

	// Function to get table data by name
	function getTableData(tableName: string): any[] {
		return tableData[tableName] || [];
	}

	// Function to format type name for display
	function formatTypeName(type: string): string {
		return schemaService.formatColumnType(type);
	}

	// Drag and drop handlers
	function handleDragOver(event: DragEvent, table: string, field: string) {
		event.preventDefault();
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
	}

	function propagateData(sourceTable: string, sourceField: string, csvColumn: string) {
		// Skip if schema relationships aren't loaded yet
		if (!schemaRelationships) return;

		const relationship = schemaRelationships[sourceTable];
		if (!relationship) return;

		// If this is a join table, propagate to related tables
		if (relationship.isJoinTable && relationship.joins) {
			relationship.joins.forEach((join: any) => {
				if (join.via === sourceField) {
					// This field is a foreign key to another table
					console.log(`Propagating ${csvColumn} to ${join.table}.${join.targetColumn}`);

					// Update the related table's field with the same data
					updatePreviewData(join.table, join.targetColumn, csvColumn);

					// Create mapping for the propagated field
					mappings[csvColumn] = `${join.table}.${join.targetColumn}`;
				}
			});
		}

		// If this is a primary or natural key field in a main table, propagate to join tables
		if (!relationship.isJoinTable) {
			const isPrimaryKey = sourceField === relationship.primaryKey;
			const isNaturalKey =
				relationship.naturalKeys && relationship.naturalKeys.includes(sourceField);

			if (isPrimaryKey || isNaturalKey) {
				// Check all tables to find ones that reference this field
				Object.entries(schemaRelationships).forEach(([tableName, tableRel]: [string, any]) => {
					if (tableRel.isJoinTable && tableRel.joins) {
						tableRel.joins.forEach((join: any) => {
							if (join.table === sourceTable && join.targetColumn === sourceField) {
								console.log(`Propagating ${csvColumn} to ${tableName}.${join.via}`);

								// Update the join table's field with the same data
								updatePreviewData(tableName, join.via, csvColumn);

								// Create mapping for the propagated field
								mappings[csvColumn] = `${tableName}.${join.via}`;
							}
						});
					}
				});
			}
		}
	}

	function updateTableData(table: string, field: string, csvColumn: string, previewRecords: any[]) {
		if (!tableData[table]) {
			tableData[table] = Array(emptyRows).fill({});
		}

		tableData[table] = tableData[table].map((row, index) => {
			if (index < previewRecords.length) {
				return {
					...row,
					[field]: previewRecords[index][csvColumn]
				};
			}
			return row;
		});
	}

	function updatePreviewData(table: string, field: string, csvColumn: string) {
		if (!transformData || !transformData.records || transformData.records.length === 0) return;

		// Get the first few records to display in the preview
		const previewRecords = transformData.records.slice(0, emptyRows);

		// Use the helper function to update the table data
		updateTableData(table, field, csvColumn, previewRecords);
	}

	function isFieldMapped(table: string, field: string): boolean {
		return Object.values(mappings).includes(`${table}.${field}`);
	}

	function getMappedColumn(table: string, field: string): string | null {
		const entry = Object.entries(mappings).find(([_, mapping]) => mapping === `${table}.${field}`);
		return entry ? entry[0] : null;
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
		<div class="debug-info">
			<p>Tables found: {tableNames.length}</p>
			<p>Table names: {tableNames.join(', ')}</p>
		</div>

		{#each tableNames as tableName}
			<div class="table-section">
				<h4 class="table-title">{tableName}</h4>
				<div class="table-container">
					<table>
						<thead>
							<tr>
								{#each schemaTableHeaders[tableName] || [] as header}
									<th
										class={`${isFieldMapped(tableName, header) ? 'mapped-field' : ''} ${dragOverField?.table === tableName && dragOverField?.field === header ? 'drag-over' : ''}`}
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

	.debug-info {
		background-color: #2a2a3a;
		padding: 10px;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.8rem;
		color: #64b5f6;
	}

	.debug-info p {
		margin: 5px 0;
	}

	.table-section {
		margin-bottom: 1.5rem;
	}

	.table-title {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		color: #e0e0e0;
	}

	.table-container {
		overflow-x: auto;
		border-radius: 4px;
		background-color: #1e1e2e;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th {
		background-color: #2a2a3a;
		color: #e0e0e0;
		font-weight: 500;
		text-align: left;
		padding: 0.5rem;
		position: relative;
		border: 1px solid #3a3a4a;
		min-width: 120px;
	}

	.header-controls {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.header-text {
		font-weight: 600;
	}

	.type-pseudo-select {
		font-size: 0.7rem;
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		background-color: #3a3a4a;
		color: #ccc;
		width: fit-content;
	}

	.type-pseudo-select[data-type='String'] {
		background-color: #2c3e50;
		color: #ecf0f1;
	}

	.type-pseudo-select[data-type='Number'] {
		background-color: #27ae60;
		color: #ecf0f1;
	}

	.type-pseudo-select[data-type='Date'] {
		background-color: #8e44ad;
		color: #ecf0f1;
	}

	.type-pseudo-select[data-type='GPS'] {
		background-color: #d35400;
		color: #ecf0f1;
	}

	.type-pseudo-select[data-type='Latitude'],
	.type-pseudo-select[data-type='Longitude'] {
		background-color: #e67e22;
		color: #ecf0f1;
	}

	td {
		padding: 0.5rem;
		border: 1px solid #3a3a4a;
		color: #b0b0c0;
	}

	.mapped-field {
		background-color: #2d4263;
	}

	.mapped-indicator {
		font-size: 0.7rem;
		color: #64b5f6;
		margin-top: 0.25rem;
	}

	.drag-over {
		background-color: #3d5277;
	}

	.loading-indicator {
		padding: 1rem;
		color: #64b5f6;
		text-align: center;
	}

	.error-message {
		padding: 1rem;
		color: #e57373;
		background-color: rgba(229, 115, 115, 0.1);
		border-radius: 4px;
		text-align: center;
		margin-bottom: 1rem;
	}
</style>
