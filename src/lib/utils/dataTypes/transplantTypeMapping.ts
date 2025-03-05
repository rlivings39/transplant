/**
 * Type Mapping Utility
 *
 * Maps between Transform data types and database schema types
 * Ensures consistency between the two systems
 */

// Transform data types
export type TransformDataType = 'string' | 'number' | 'date' | 'gps' | 'latitude' | 'longitude';

// Database schema types
export type DatabaseFieldType = 'string' | 'numeric' | 'timestamp' | 'integer' | 'boolean' | 'json';

// Validation specifications for each type
export interface TypeValidationSpec {
	type: TransformDataType;
	dbType: DatabaseFieldType;
	validation: {
		required?: boolean;
		min?: number;
		max?: number;
		decimals?: number;
		format?: string;
		regex?: RegExp;
	};
	description: string;
}

// Type validation specifications
export const typeValidationSpecs: Record<TransformDataType, TypeValidationSpec> = {
	string: {
		type: 'string',
		dbType: 'string',
		validation: {},
		description: 'Text value with no specific format requirements'
	},
	number: {
		type: 'number',
		dbType: 'numeric',
		validation: {
			decimals: 2 // Default precision
		},
		description: 'Numeric value with optional decimal places'
	},
	date: {
		type: 'date',
		dbType: 'timestamp',
		validation: {
			format: 'YYYY-MM-DD',
			regex: /^\d{4}-\d{2}-\d{2}$/
		},
		description: 'Date in ISO format (YYYY-MM-DD)'
	},
	gps: {
		type: 'gps',
		dbType: 'string', // Stored as text in format "lat,lon"
		validation: {},
		description: 'GPS coordinates in decimal degrees (latitude, longitude)'
	},
	latitude: {
		type: 'latitude',
		dbType: 'numeric',
		validation: {
			min: -90,
			max: 90,
			decimals: 7
		},
		description: 'Latitude coordinate (-90 to 90 degrees)'
	},
	longitude: {
		type: 'longitude',
		dbType: 'numeric',
		validation: {
			min: -180,
			max: 180,
			decimals: 7
		},
		description: 'Longitude coordinate (-180 to 180 degrees)'
	}
};

// Map Transform type to Database type
export function mapToDatabaseType(transformType: TransformDataType): DatabaseFieldType {
	return typeValidationSpecs[transformType]?.dbType || 'string';
}

// Get validation spec for a type
export function getValidationSpec(type: TransformDataType): TypeValidationSpec {
	return typeValidationSpecs[type] || typeValidationSpecs['string'];
}

// Format display name for a type
export function formatTypeDisplayName(type: TransformDataType): string {
	if (!type) return 'String';
	return type.charAt(0).toUpperCase() + type.slice(1);
}

// Get type description
export function getTypeDescription(type: TransformDataType): string {
	return typeValidationSpecs[type]?.description || 'Unknown type';
}
