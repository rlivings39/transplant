/**
 * Schema Metadata Service
 *
 * This service provides hardcoded schema metadata for the application.
 * Instead of trying to extract metadata from Drizzle ORM (which can be complex),
 * we define the schema structure explicitly.
 */

// Types for schema metadata
export interface TableMetadata {
	name: string;
	columns: Record<string, any>;
	primaryKeys: string[];
	foreignKeys: ForeignKeyMetadata[];
	naturalKeys: string[];
	isJoinTable: boolean;
}

export interface ForeignKeyMetadata {
	columnName: string;
	targetTable: string;
	targetColumn: string;
}

export interface SchemaMetadata {
	tables: Record<string, TableMetadata>;
	relationships: Record<string, RelationshipMetadata>;
}

export interface RelationshipMetadata {
	isJoinTable: boolean;
	joins?: JoinMetadata[];
	primaryKey?: string;
	naturalKeys?: string[];
}

export interface JoinMetadata {
	table: string;
	via: string;
	targetColumn: string;
}

/**
 * Extract metadata from the schema tables
 */
export function extractSchemaMetadata(): SchemaMetadata {
	// Define our known tables and their structure
	const tables: Record<string, TableMetadata> = {
		Land: {
			name: 'Land',
			columns: {
				land_id: { name: 'land_id', dataType: 'text', notNull: true },
				land_name: { name: 'land_name', dataType: 'text', notNull: true },
				hectares: { name: 'hectares', dataType: 'numeric', notNull: false },
				land_holder: { name: 'land_holder', dataType: 'text', notNull: false },
				gps_lat: { name: 'gps_lat', dataType: 'numeric', notNull: false },
				gps_lon: { name: 'gps_lon', dataType: 'numeric', notNull: false },
				notes: { name: 'notes', dataType: 'text', notNull: false }
			},
			primaryKeys: ['land_id'],
			foreignKeys: [],
			naturalKeys: ['land_name'],
			isJoinTable: false
		},
		Crop: {
			name: 'Crop',
			columns: {
				crop_id: { name: 'crop_id', dataType: 'text', notNull: true },
				crop_name: { name: 'crop_name', dataType: 'text', notNull: true },
				crop_stock: { name: 'crop_stock', dataType: 'integer', notNull: false },
				seedlot: { name: 'seedlot', dataType: 'text', notNull: false },
				seedzone: { name: 'seedzone', dataType: 'text', notNull: false },
				notes: { name: 'notes', dataType: 'text', notNull: false }
			},
			primaryKeys: ['crop_id'],
			foreignKeys: [],
			naturalKeys: ['crop_name'],
			isJoinTable: false
		},
		Planting: {
			name: 'Planting',
			columns: {
				id: { name: 'id', dataType: 'text', notNull: true },
				land_id: { name: 'land_id', dataType: 'text', notNull: false },
				crop_id: { name: 'crop_id', dataType: 'text', notNull: false },
				planted: { name: 'planted', dataType: 'numeric', notNull: false },
				planting_date: { name: 'planting_date', dataType: 'timestamp', notNull: false },
				notes: { name: 'notes', dataType: 'text', notNull: false }
			},
			primaryKeys: ['id'],
			foreignKeys: [
				{ columnName: 'land_id', targetTable: 'Land', targetColumn: 'land_id' },
				{ columnName: 'crop_id', targetTable: 'Crop', targetColumn: 'crop_id' }
			],
			naturalKeys: [],
			isJoinTable: true
		}
	};

	// Build relationships
	const relationships = Object.entries(tables).reduce(
		(acc, [tableName, metadata]) => {
			acc[tableName] = {
				isJoinTable: metadata.isJoinTable,
				primaryKey: metadata.primaryKeys[0],
				naturalKeys: metadata.naturalKeys,
				joins: metadata.isJoinTable
					? metadata.foreignKeys.map((fk) => ({
							table: fk.targetTable,
							via: fk.columnName,
							targetColumn: fk.targetColumn
						}))
					: []
			};

			return acc;
		},
		{} as Record<string, RelationshipMetadata>
	);

	return { tables, relationships };
}

/**
 * Map Drizzle types to application types
 */
export function mapColumnTypes(
	tables: Record<string, TableMetadata>
): Record<string, Record<string, string>> {
	return Object.entries(tables).reduce(
		(acc, [tableName, table]) => {
			acc[tableName] = Object.entries(table.columns).reduce(
				(types, [colName, col]) => {
					// Map Drizzle types to application types
					let type = 'string';

					if (col.dataType === 'numeric' || col.dataType === 'integer') {
						type = 'number';
					} else if (col.dataType === 'timestamp') {
						type = 'date';
					} else if (colName.includes('gps_lat')) {
						type = 'latitude';
					} else if (colName.includes('gps_lon')) {
						type = 'longitude';
					} else if (col.dataType === 'boolean') {
						type = 'boolean';
					} else if (col.dataType === 'json') {
						type = 'json';
					}

					types[colName] = type;
					return types;
				},
				{} as Record<string, string>
			);

			return acc;
		},
		{} as Record<string, Record<string, string>>
	);
}

/**
 * Get table headers from schema metadata
 */
export function getTableHeaders(tables: Record<string, TableMetadata>): Record<string, string[]> {
	return Object.entries(tables).reduce(
		(acc, [tableName, table]) => {
			acc[tableName] = Object.keys(table.columns);
			return acc;
		},
		{} as Record<string, string[]>
	);
}

/**
 * Helper to determine if a field propagates to other tables
 */
export function getFieldPropagation(
	tableName: string,
	fieldName: string,
	relationships: Record<string, RelationshipMetadata>
): JoinMetadata[] | null {
	if (!relationships[tableName]) return null;

	// Check if this field is referenced by other tables
	const propagatesTo: JoinMetadata[] = [];

	Object.entries(relationships).forEach(([otherTable, rel]) => {
		if (otherTable === tableName) return;

		if (rel.joins) {
			rel.joins.forEach((join) => {
				if (join.table === tableName && join.targetColumn === fieldName) {
					propagatesTo.push({
						table: otherTable,
						via: join.via,
						targetColumn: fieldName
					});
				}
			});
		}
	});

	return propagatesTo.length ? propagatesTo : null;
}
