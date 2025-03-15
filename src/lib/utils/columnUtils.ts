/**
 * Utility functions for working with Column objects
 *
 * This file provides functions for:
 * 1. Creating columns from raw data
 * 2. Converting between legacy and Column-based formats
 * 3. Detecting column types
 * 4. Validating column data
 * 5. Managing cell validation states
 *
 * REFACTORING ANNOTATIONS:
 * [NEW] - Part of the new Column architecture
 * [BRIDGE] - Temporary compatibility functions
 * [DELETE] - Legacy code that will be removed
 * [REPLACE: X] - Will be replaced by function X
 * [INTENTION: X] - Future implementation plans
 */
import type { Column } from './../types/columnModel';

import type {
	StringColumn,
	NumberColumn,
	DateColumn,
	GpsColumn,
	ColumnTypeMap,
	ColumnBasedTransformData,
	GpsCoordinate,
	CellValidationState,
	selectTypeCoercion
} from '$lib/types/columnTypes';

import {
	StringColumnModel,
	NumberColumnModel,
	DateColumnModel,
	GpsColumnModel
} from '$lib/types/columnModel';

import { parseGpsCoordinate } from './dataTypes/gpsType';

/**
 * Create a column of the appropriate type
 * [NEW] Core function of the Column architecture
 */
// export function createColumn(name: string, type: 'string' | 'number' | 'date' | 'gps'): Column {
// 	switch (type) {
// 		case 'string':
// 			return new StringColumnModel(name);
// 		case 'number':
// 			return new NumberColumnModel(name);
// 		case 'date':
// 			return new DateColumnModel(name);
// 		case 'gps':
// 			return new GpsColumnModel(name);
// 		default:
// 			return new StringColumnModel(name);
// 	}
// }

/**
 * Update cell validation states for a column
 * This is the "lever" that controls the isGreyedOut state based on:
 * 1. Whether a cell passes type validation (failedSelectDetection)
 * 2. Whether the column is toggled on/off (isToggled)
 *
 * [NEW] Core function of the Column architecture
 */
// export function updateCellValidationStates<T extends Column>(column: T): T {
// 	// If no cellValidation exists yet, create it
// 	if (!column.cellValidation) {
// 		column.cellValidation = [];
// 	}

// 	// Process each value in the column
// 	column.values.forEach((value, rowIndex) => {
// 		// Find existing validation state or create a new one
// 		let validationState = column.cellValidation!.find((v) => v.rowIndex === rowIndex);

// 		if (!validationState) {
// 			validationState = {
// 				rowIndex,
// 				isValid: true,
// 				failedSelectDetection: false,
// 				isGreyedOut: false,
// 				originalValue: value
// 			};
// 			column.cellValidation!.push(validationState);
// 		}

// 		// Check if the value is valid for the column type
// 		validationState.isValid = validateValueForType(value, column.type, column.selectTypeCoercion);

// 		// Update failedSelectDetection based on validity
// 		validationState.failedSelectDetection = !validationState.isValid;

// 		// The key logic: a cell is greyed out if it fails type detection OR the column is toggled off
// 		validationState.isGreyedOut = validationState.failedSelectDetection || !column.isToggled;
// 	});

// 	return column;
// }

/**
 * Validate a single value against a column type
 * Takes into account any type coercion that may have been applied
 *
 * [NEW] Core validation function for the Column architecture
 */
export function validateValueForType(
	value: any,
	type: 'string' | 'number' | 'date' | 'gps',
	selectTypeCoercion?: selectTypeCoercion
): boolean {
	// Null values are valid for all types
	if (value === null || value === undefined || value === '') {
		return true;
	}

	// If the type has been coerced, use the coerced type for validation
	const effectiveType = selectTypeCoercion?.isCoerced ? selectTypeCoercion.coercedTo : type;

	switch (effectiveType) {
		case 'string':
			// All values can be strings
			return true;

		case 'number':
			// For number validation, try to convert to number and check if it's not NaN
			if (typeof value === 'number') {
				return !isNaN(value);
			} else {
				const num = Number(value);
				return !isNaN(num);
			}

		case 'date':
			// For date validation, try to create a Date object
			try {
				if (value instanceof Date) {
					return !isNaN(value.getTime());
				} else {
					const date = new Date(value);
					return !isNaN(date.getTime());
				}
			} catch (e) {
				return false;
			}

		case 'gps':
			// For GPS validation, handle multiple formats

			// Handle GpsCoordinate object
			if (typeof value === 'object' && value !== null) {
				return (
					'latitude' in value &&
					'longitude' in value &&
					!isNaN(Number(value.latitude)) &&
					!isNaN(Number(value.longitude))
				);
			}
			// Handle string format "lat,lon"
			else if (typeof value === 'string' && value.includes(',')) {
				const [latStr, lonStr] = value.split(',');
				const lat = Number(latStr.trim());
				const lon = Number(lonStr.trim());
				return !isNaN(lat) && !isNaN(lon);
			}
			// Try to parse using GPS parser
			else if (typeof value === 'string') {
				return parseGpsCoordinate(value) !== null;
			}

			return false;

		default:
			return false;
	}
}

/**
 * Toggle a column on/off and update cell validation states
 * This is the main function that would be called when a user toggles a column
 *
 * [NEW] Core function of the Column architecture
 * [INTENTION: Will replace existing toggle functionality in TransformManager.svelte]
 */
export function toggleColumn<T extends Column>(column: T, isToggled: boolean): T {
	column.isToggled = isToggled;
	return updateCellValidationStates(column);
}

/**
 * Change a column's type and update cell validation states
 * This is called when a user manually changes a column's type
 *
 * [NEW] Core function of the Column architecture
 * [INTENTION: Will replace type selection functionality in TransformManager.svelte]
 */
export function changeColumnType<T extends Column>(
	column: T,
	newType: 'string' | 'number' | 'date' | 'gps'
): T {
	// Record the type coercion
	column.selectTypeCoercion = {
		isCoerced: true,
		originalType: column.type,
		coercedTo: newType,
		timestamp: Date.now()
	};

	// Update the column type
	column.type = newType as any; // Type assertion needed due to generic constraints

	// Update cell validation states based on new type
	return updateCellValidationStates(column);
}

/**
 * Create a column and populate it with values
 *
 * [NEW] Core function of the Column architecture
 */
export function createColumnWithValues(
	name: string,
	type: 'string' | 'number' | 'date' | 'gps',
	values: any[]
): Column {
	const column = createColumn(name, type);

	// Add each value to the column
	if (column.type === 'string') {
		const stringColumn = column as StringColumn;
		values.forEach((value) =>
			(stringColumn.values as (string | null)[]).push(
				value === null || value === undefined ? null : String(value)
			)
		);
	} else if (column.type === 'number') {
		const numberColumn = column as NumberColumn;
		values.forEach((value) => {
			if (value === null || value === undefined || value === '') {
				numberColumn.values.push(null);
			} else {
				const num = Number(value);
				// Store as actual number, not string
				numberColumn.values.push(isNaN(num) ? null : num);
			}
		});
	} else if (column.type === 'date') {
		const dateColumn = column as DateColumn;
		values.forEach((value) => {
			if (value === null || value === undefined || value === '') {
				dateColumn.values.push(null);
			} else {
				try {
					const date = new Date(value);
					// Store in ISO format for consistency
					dateColumn.values.push(isNaN(date.getTime()) ? null : date.toISOString());
				} catch (e) {
					// If we can't parse as date, store as null
					dateColumn.values.push(null);
				}
			}
		});
	} else if (column.type === 'gps') {
		const gpsColumn = column as GpsColumn;
		values.forEach((value) => {
			if (value === null || value === undefined || value === '') {
				gpsColumn.values.push(null);
			} else {
				try {
					// Handle GPS coordinate object
					if (
						typeof value === 'object' &&
						value !== null &&
						'latitude' in value &&
						'longitude' in value
					) {
						const coord: GpsCoordinate = {
							latitude: Number(Number(value.latitude).toFixed(7)),
							longitude: Number(Number(value.longitude).toFixed(7)),
							format: 'DD',
							precision: 7
						};
						gpsColumn.values.push(coord);
					}
					// Handle string format "lat,lon"
					else if (typeof value === 'string' && value.includes(',')) {
						const [latStr, lonStr] = value.split(',');
						const lat = Number(latStr.trim());
						const lon = Number(lonStr.trim());

						if (!isNaN(lat) && !isNaN(lon)) {
							const coord: GpsCoordinate = {
								latitude: Number(lat.toFixed(7)),
								longitude: Number(lon.toFixed(7)),
								format: 'DD',
								precision: 7
							};
							gpsColumn.values.push(coord);
						} else {
							gpsColumn.values.push(null);
						}
					} else {
						// Try to parse using the GPS parser
						const parsedGps = parseGpsCoordinate(String(value));
						if (parsedGps) {
							const coord: GpsCoordinate = {
								latitude: Number(parsedGps.latitude.toFixed(7)),
								longitude: Number(parsedGps.longitude.toFixed(7)),
								format: 'DD',
								precision: 7
							};
							gpsColumn.values.push(coord);
						} else {
							gpsColumn.values.push(null);
						}
					}
				} catch (e) {
					console.error(`Error parsing GPS value: ${value}`, e);
					gpsColumn.values.push(null);
				}
			}
		});
	}

	return column;
}

/**
 * Convert legacy format to Column-based format
 *
 * [BRIDGE] Temporary function to convert between formats during migration
 * [INTENTION: Will be removed once Transform stage directly produces Column format]
 */
// export function convertLegacyToColumnBased(
// 	legacy: LegacyValidatedTransformData
// ): ColumnBasedTransformData {
// 	console.log('[ColumnUtils] Converting legacy format to column-based format');
// 	console.log('[ColumnUtils] Legacy data structure:', {
// 		recordsCount: legacy.records?.length || 0,
// 		columnTypeCount: Object.keys(legacy.columnTypes || {}).length,
// 		columnTypes: legacy.columnTypes,
// 		sampleRecord: legacy.records?.[0] || null
// 	});

// 	const columns: Column[] = [];

// 	// Get all unique column names
// 	const columnNames = Object.keys(legacy.columnTypes);
// 	console.log('[ColumnUtils] Column names found:', columnNames);

// 	// For each column name, create a column of the appropriate type
// 	columnNames.forEach((name) => {
// 		const type = legacy.columnTypes[name];
// 		console.log(`[ColumnUtils] Processing column: ${name}, type: ${type}`);

// 		// Extract values for this column from all records
// 		const values = legacy.records.map((record) => record[name]);
// 		console.log(`[ColumnUtils] Extracted ${values.length} values for column ${name}`);
// 		console.log(`[ColumnUtils] Sample values for ${name}:`, values.slice(0, 3));

// 		// Create and add the column
// 		const column = createColumnWithValues(name, type, values);
// 		// Log basic column info without accessing potentially missing properties
// 		console.log(`[ColumnUtils] Created column object for ${name}:`, {
// 			name: column.name,
// 			type: column.type,
// 			valuesCount: column.values?.length || 0
// 		});

// 		// Set isToggled to false by default (as per application requirements)
// 		// This ensures columns start in an unselected state in TransPlant
// 		column.isToggled = false;

// 		// Log the isToggled state for debugging
// 		console.log(`[ColumnUtils] Column ${name} isToggled set to: ${column.isToggled}`);

// 		// Set isFormatted based on type
// 		// For GPS columns, we want to ensure they're properly formatted
// 		if (type === 'gps') {
// 			const gpsColumn = column as GpsColumn;
// 			gpsColumn.format = {
// 				gpsFormat: 'DD',
// 				precision: 7
// 			};
// 			gpsColumn.isFormatted = true;
// 			console.log(`[ColumnUtils] Formatted GPS column ${name} with DD format and precision 7`);
// 		} else if (type === 'number') {
// 			const numberColumn = column as NumberColumn;
// 			numberColumn.format = {
// 				precision: 2 // Use 2 decimal places for regular numbers
// 			};
// 			numberColumn.isFormatted = true;
// 			console.log(`[ColumnUtils] Formatted Number column ${name} with precision 2`);
// 		} else {
// 			column.isFormatted = false; // For string and date columns, mark as not formatted
// 			console.log(`[ColumnUtils] No formatting applied for ${type} column ${name}`);
// 		}

// 		// Update cell validation states
// 		updateCellValidationStates(column);
// 		console.log(`[ColumnUtils] Updated cell validation states for ${name}`);

// 		columns.push(column);
// 	});

// 	console.log('[ColumnUtils] Conversion complete. Created', columns.length, 'columns');
// 	return { columns };
// }

/**
 * Detect the type of a column based on its values
 *
 * [NEW] Core function of the Column architecture
 * [INTENTION: Will replace existing type detection in TransformManager.svelte]
 */
export function detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'gps' {
	// Filter out null/undefined values
	const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');

	if (nonNullValues.length === 0) {
		return 'string'; // Default to string for empty columns
	}

	// Check if all values are numbers
	const allNumbers = nonNullValues.every((v) => {
		const num = Number(v);
		return !isNaN(num);
	});

	if (allNumbers) {
		return 'number';
	}

	// Check if values look like GPS coordinates 
	// [DELETE] Legacy GPS detection, should be in @dataTypes
	const gpsPattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
	const mightBeGps = nonNullValues.some((v) => {
		if (typeof v !== 'string') return false;
		return gpsPattern.test(v) || parseGpsCoordinate(v) !== null;
	});

	if (mightBeGps) {
		return 'gps';
	}

	// Check if values are dates
	const mightBeDates = nonNullValues.every((v) => {
		try {
			const date = new Date(v);
			return !isNaN(date.getTime());
		} catch (e) {
			return false;
		}
	});

	if (mightBeDates) {
		return 'date';
	}

	// Default to string
	return 'string';
}

/**
 * Extract a specific column from a set of records
 *
 * [NEW] Utility function for the Column architecture
 */
export function extractColumnFromRecords(
	records: Array<{ [key: string]: any }>,
	columnName: string
): any[] {
	return records.map((record) => record[columnName] || null);
}

/**
 * Create columns from records and column types
 *
 * [NEW] Core function of the Column architecture
 * [INTENTION: Will be used to convert imported data to Column format]
 */
export function createColumnsFromRecords(
	records: Array<{ [key: string]: any }>,
	columnTypes: ColumnTypeMap
): Column[] {
	const columns: Column[] = [];

	Object.entries(columnTypes).forEach(([name, type]) => {
		const values = extractColumnFromRecords(records, name);
		columns.push(createColumnWithValues(name, type, values));
	});

	return columns;
}
