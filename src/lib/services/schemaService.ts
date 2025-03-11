import { writable, derived, get } from 'svelte/store';

// Debug flag to control logging
const DEBUG = false;

// Logger utility for consistent and controlled logging
const logger = {
	debug: (message: string, ...args: any[]) => {
		if (DEBUG) console.log(`[SchemaService] ${message}`, ...args);
	},
	info: (message: string, ...args: any[]) => {
		console.log(`[SchemaService] ${message}`, ...args);
	},
	warn: (message: string, ...args: any[]) => {
		console.warn(`[SchemaService] ${message}`, ...args);
	},
	error: (message: string, ...args: any[]) => {
		console.error(`[SchemaService] ${message}`, ...args);
	}
};

// Types
export interface TableMetadata {
	name: string;
	columns: Record<string, any>;
	primaryKeys: string[];
	foreignKeys: any[];
	naturalKeys: string[];
	isJoinTable: boolean;
}

export interface RelationshipMetadata {
	isJoinTable: boolean;
	joins?: any[];
	primaryKey?: string;
	naturalKeys?: string[];
}

export interface JoinMetadata {
	table: string;
	via: string;
	targetColumn: string;
}

// Stores for schema metadata
const schemaMetadata = writable<Record<string, TableMetadata> | null>(null);
const schemaRelationships = writable<Record<string, RelationshipMetadata> | null>(null);
const columnTypes = writable<Record<string, Record<string, string>> | null>(null);
const tableHeaders = writable<Record<string, string[]> | null>(null);
const isLoading = writable(true);
const error = writable<string | null>(null);

// Derive schema data from tableHeaders and columnTypes
const schemaData = derived(
	[tableHeaders, columnTypes, schemaMetadata],
	([$tableHeaders, $columnTypes, $schemaMetadata]) => {
		logger.debug('Deriving schema data...');
		logger.debug('Data availability:', {
			tableHeaders: !!$tableHeaders,
			columnTypes: !!$columnTypes,
			schemaMetadata: !!$schemaMetadata
		});

		if (!$tableHeaders || !$columnTypes) {
			logger.debug('Missing required data for schema derivation');
			return null;
		}

		const result: Record<string, { headers: string[]; columnTypes: Record<string, string> }> = {};

		Object.keys($tableHeaders).forEach((tableName) => {
			result[tableName] = {
				headers: $tableHeaders[tableName] || [],
				columnTypes: $columnTypes[tableName] || {}
			};
		});

		logger.debug('Derived schema data successfully with tables:', Object.keys(result));
		return result;
	}
);

// Load schema metadata
async function loadSchemaMetadata() {
	logger.info('Loading schema metadata');
	isLoading.set(true);
	error.set(null);

	try {
		const response = await fetch('/api/schema');

		if (!response.ok) {
			logger.error('API error:', response.status, response.statusText);
			throw new Error(`Failed to load schema metadata: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		logger.debug('Received schema data', {
			tableCount: Object.keys(data.tables).length,
			tables: Object.keys(data.tables)
		});

		schemaMetadata.set(data.tables);
		schemaRelationships.set(data.relationships);
		columnTypes.set(data.columnTypes);
		tableHeaders.set(data.tableHeaders);

		return data;
	} catch (err) {
		logger.error('Error loading schema metadata:', err);
		error.set(err.message);
		return null;
	} finally {
		isLoading.set(false);
	}
}

// Helper to determine if a field propagates to other tables
function getFieldPropagation(tableName: string, fieldName: string) {
	const relationships = get(schemaRelationships);
	if (!relationships) return null;

	// Check if this field is referenced by other tables
	const propagatesTo = [];

	Object.entries(relationships).forEach(([otherTable, rel]) => {
		if (otherTable === tableName) return;

		if (rel.joins) {
			rel.joins.forEach((join) => {
				if (join.table === tableName && join.targetColumn === fieldName) {
					propagatesTo.push({
						table: otherTable,
						via: join.via,
						targetColumn: join.targetColumn
					});
				}
			});
		}
	});

	return propagatesTo.length ? propagatesTo : null;
}

// Get table headers for a specific table
function getTableHeadersForTable(tableName: string): string[] | null {
	const headers = get(tableHeaders);
	if (!headers) return null;
	return headers[tableName] || null;
}

// Get column type for a specific table and field
function getColumnType(tableName: string, fieldName: string): string | null {
	const types = get(columnTypes);
	if (!types || !types[tableName]) return null;
	return types[tableName][fieldName] || null;
}

// Get relationship info for a specific table
function getRelationshipForTable(tableName: string): RelationshipMetadata | null {
	const relationships = get(schemaRelationships);
	if (!relationships) return null;
	return relationships[tableName] || null;
}

// Format column type for display
function formatColumnType(type: string): string {
	switch (type) {
		case 'string':
			return 'String';
		case 'number':
			return 'Number';
		case 'date':
			return 'Date';
		case 'gps':
			return 'GPS';
		case 'latitude':
			return 'Latitude';
		case 'longitude':
			return 'Longitude';
		case 'boolean':
			return 'Boolean';
		case 'json':
			return 'JSON';
		default:
			return 'String';
	}
}

export const schemaService = {
	loadSchemaMetadata,
	metadata: { subscribe: schemaMetadata.subscribe },
	relationships: { subscribe: schemaRelationships.subscribe },
	columnTypes: { subscribe: columnTypes.subscribe },
	tableHeaders: { subscribe: tableHeaders.subscribe },
	schemaData: { subscribe: schemaData.subscribe },
	isLoading: { subscribe: isLoading.subscribe },
	error: { subscribe: error.subscribe },
	getFieldPropagation,
	getTableHeadersForTable,
	getColumnType,
	getRelationshipForTable,
	formatColumnType
};
