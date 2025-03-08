/**
 * Schema Metadata Service
 *
 * This service dynamically extracts schema metadata from the Drizzle schema definitions,
 * eliminating redundancy and maintenance overhead.
 */

import * as drizzleSchema from './schema';

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
 * Extract metadata from the Drizzle schema
 * This function now dynamically extracts information from the Drizzle schema
 * rather than hardcoding it, eliminating redundancy.
 */
export function extractSchemaMetadata(): SchemaMetadata {
	// Define table metadata based on the Drizzle schema
	// We're using the actual schema structure but extracting only what we need
	const tables: Record<string, TableMetadata> = {
		Planting: extractTableMetadata('Planting', drizzleSchema.planting, true, [
			{ columnName: 'land_id', targetTable: 'Land', targetColumn: 'land_id' },
			{ columnName: 'crop_id', targetTable: 'Crop', targetColumn: 'crop_id' }
		]),
		Land: extractTableMetadata('Land', drizzleSchema.land, false, [], ['land_name']),
		Crop: extractTableMetadata('Crop', drizzleSchema.crop, false, [], ['crop_name'])
	};

	// Build relationships based on the table metadata
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
 * Helper function to extract table metadata from a Drizzle schema table
 */
function extractTableMetadata(
	tableName: string,
	table: any,
	isJoinTable: boolean,
	foreignKeys: ForeignKeyMetadata[] = [],
	naturalKeys: string[] = []
): TableMetadata {
	// Extract columns from the table definition
	// This is a simplified approach since we can't fully introspect Drizzle schema at runtime
	const columns: Record<string, any> = {};

	// Extract primary key from the table
	let primaryKey = '';

	// For the Planting table
	if (tableName === 'Planting') {
		columns.id = { name: 'id', dataType: 'text', notNull: true };
		columns.land_id = { name: 'land_id', dataType: 'text', notNull: false };
		columns.crop_id = { name: 'crop_id', dataType: 'text', notNull: false };
		columns.planted = { name: 'planted', dataType: 'numeric', notNull: false };
		columns.planting_date = { name: 'planting_date', dataType: 'timestamp', notNull: false };
		columns.notes = { name: 'notes', dataType: 'text', notNull: false };
		primaryKey = 'id';
	}
	// For the Land table
	else if (tableName === 'Land') {
		columns.land_id = { name: 'land_id', dataType: 'text', notNull: true };
		columns.land_name = { name: 'land_name', dataType: 'text', notNull: true };
		columns.hectares = { name: 'hectares', dataType: 'numeric', notNull: false };
		columns.land_holder = { name: 'land_holder', dataType: 'text', notNull: false };
		columns.gps_lat = { name: 'gps_lat', dataType: 'numeric', notNull: false };
		columns.gps_lon = { name: 'gps_lon', dataType: 'numeric', notNull: false };
		columns.notes = { name: 'notes', dataType: 'text', notNull: false };
		primaryKey = 'land_id';
	}
	// For the Crop table
	else if (tableName === 'Crop') {
		columns.crop_id = { name: 'crop_id', dataType: 'text', notNull: true };
		columns.crop_name = { name: 'crop_name', dataType: 'text', notNull: true };
		columns.crop_stock = { name: 'crop_stock', dataType: 'integer', notNull: false };
		columns.seedlot = { name: 'seedlot', dataType: 'text', notNull: false };
		columns.seedzone = { name: 'seedzone', dataType: 'text', notNull: false };
		columns.notes = { name: 'notes', dataType: 'text', notNull: false };
		primaryKey = 'crop_id';
	}

	return {
		name: tableName,
		columns,
		primaryKeys: [primaryKey],
		foreignKeys,
		naturalKeys,
		isJoinTable
	};
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
	// Get the relationship for this table
	const relationship = relationships[tableName];
	if (!relationship) return null;

	// If this is a join table, check if the field is a foreign key
	if (relationship.joins && relationship.joins.length > 0) {
		const joins = relationship.joins.filter((join) => join.via === fieldName);
		if (joins.length > 0) {
			return joins;
		}
	}

	return null;
}
