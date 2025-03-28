/**
 * ColumnRep model implementation for TransPlant
 *
 * This file provides concrete implementations of the ColumnRep interfaces
 * defined in columnTypes.ts, with methods for working with column data.
 *
 * REFACTORING ANNOTATIONS:
 * [NEW] - Part of the new ColumnRep architecture
 * [BRIDGE] - Temporary compatibility functions
 * [DELETE] - Legacy code that will be removed
 * [REPLACE: X] - Will be replaced by function X
 * [INTENTION: X] - Future implementation plans
 */

import type {
	// ColumnDef,
	StringColumn,
	NumberColumn,
	DateColumn,
	GpsColumn,
	GpsCoordinate,
	selectTypeCoercion,
	CellValidationState
} from './columnTypes';

export interface ColumnDef {
	headerName: string; // The header/importedColumnName
	isToggled: boolean; // Whether this column is toggled on/off
	isMapped?: boolean; // Whether this field is mapped to a DB column
	mappedTo?: string; // DB column this is mapped to (format: "table.column")
	isFormatted: boolean; // Whether the data has been formatted
	isMerged?: boolean; // Whether this column is created by merging other columns
	mergedFrom?: string[]; // If merged, the source columns that were merged
	isGpsSource?: boolean; // Whether this column is a source for the universal GPS column
	// Type coercion tracking

	selectTypeCoercion?: selectTypeCoercion; // Information about type coercion if applicable
	// Cell-level validation state
	cellValidation?: CellValidationState[]; // Validation state for individual cells
	// Database mapping properties (only relevant if isMapped is true)
	dbMapping?: {
		table: string; // Target database table
		column: string; // Target database column
		isRequired: boolean; // Whether the target column is required
		isNaturalKey?: boolean; // Whether this maps to a natural key
		naturalKeyFor?: string; // If natural key, the primary key it corresponds to
		isInsertPlanted?: boolean; // Whether this is a column from Land/Crop inserted into Planting for convenience
	};
}

export interface ColumnRep extends ColumnDef {
	/** The column name/header from the imported data */
	headerName: string;
	type: 'string' | 'number' | 'date' | 'gps';
	/** The actual data values for this column */
	values: Array<string | number | null>;
	/** Optional validation errors by row index */
	validationErrors?: Set<number>;
	component?: any; // Add component property

	// Add index signature to allow string indexing 26 Mar 2025
	[key: string]: any;
}

/**
 * Base column model with shared implementation
 * [NEW] Core class of the ColumnRep architecture
 * [INTENTION: Will replace existing column handling in TransformManager.svelte]
 */
export class BaseColumnModel implements ColumnDef {
	headerName: string;
	isToggled: boolean;
	isMapped: boolean;
	mappedTo?: string;
	isFormatted: boolean;
	isMerged?: boolean;
	mergedFrom?: string[];
	isGpsSource?: boolean;
	type: 'string' | 'number' | 'date' | 'gps' = 'string';
	selectTypeCoercion?: selectTypeCoercion;
	cellValidation?: CellValidationState[];
	dbMapping?: {
		table: string;
		column: string;
		isRequired: boolean;
		isNaturalKey?: boolean;
		naturalKeyFor?: string;
		isInsertPlanted?: boolean;
	};

	constructor(headerName: string) {
		this.headerName = headerName;
		this.isToggled = true;
		this.isMapped = false;
		this.isFormatted = false;
	}
	changeType(newType: 'string' | 'number' | 'date' | 'gps', changedBy: 'auto' | 'user' = 'user') {
		if (this.type !== newType) {
			this.selectTypeCoercion = {
				originalType: this.type,
				coercedType: newType,
				timestamp: new Date(),
				changedBy
			};
			this.type = newType;
			this.isFormatted = false;
		}
	}

	// Add a method to check if type was coerced
	get wasTypeCoerced(): boolean {
		return (
			!!this.selectTypeCoercion &&
			this.selectTypeCoercion.originalType !== this.selectTypeCoercion.coercedType
		);
	}
}

interface selectTypeCoercion {
	originalType: 'string' | 'number' | 'date' | 'gps';
	coercedType: 'string' | 'number' | 'date' | 'gps';
	timestamp: Date;
	changedBy: 'auto' | 'user';
}
/**
 * String column implementation
 *
 * [NEW] Core class of the ColumnRep architecture
 */
export class StringColumnModel extends BaseColumnModel implements StringColumn {
	type: 'string' = 'string';
	values: (string | null)[] = [];
	validation?: {
		pattern?: string;
		minLength?: number;
		maxLength?: number;
	};

	constructor(name: string) {
		super(name);
	}

	addValue(value: any): string | null {
		const formattedValue = this.formatValue(value);
		this.values.push(formattedValue);
		this.isFormatted = true;
		return formattedValue;
	}

	formatValue(value: any): string | null {
		if (value === null || value === undefined) return null;
		return String(value);
	}
}

/**
 * Number column implementation
 *
 * [NEW] Core class of the ColumnRep architecture
 * [INTENTION: Will handle proper numeric precision for GPS coordinates]
 */
export class NumberColumnModel extends BaseColumnModel implements NumberColumn {
	type: 'number' = 'number';
	values: (number | null)[] = [];
	format?: {
		precision?: number;
		useThousandsSeparator?: boolean;
	};
	validation?: {
		min?: number;
		max?: number;
	};

	constructor(name: string, precision?: number) {
		super(name);
		this.format = { precision: precision || 2 };
	}

	addValue(value: any): number | null {
		const formattedValue = this.formatValue(value);
		this.values.push(formattedValue);
		this.isFormatted = true;
		return formattedValue;
	}

	formatValue(value: any): number | null {
		if (value === null || value === undefined || value === '') return null;

		// Convert to number
		const num = Number(value);
		if (isNaN(num)) return null;

		// Apply precision if specified
		if (this.format?.precision !== undefined) {
			// Use toFixed for string conversion, then convert back to number
			// This ensures proper rounding to the specified precision
			return Number(num.toFixed(this.format.precision));
		}

		return num;
	}
}

/**
 * Date column implementation
 *
 * [NEW] Core class of the ColumnRep architecture
 */
export class DateColumnModel extends BaseColumnModel implements DateColumn {
	type: 'date' = 'date';
	values: (string | null)[] = [];
	format?: {
		dateFormat?: string;
	};

	constructor(headerName: string, dateFormat?: string) {
		super(headerName);
		this.format = { dateFormat: dateFormat || 'YYYY-MM-DD' };
	}

	addValue(value: any): string | null {
		const formattedValue = this.formatValue(value);
		this.values.push(formattedValue);
		this.isFormatted = true;
		return formattedValue;
	}

	formatValue(value: any): string | null {
		if (value === null || value === undefined || value === '') return null;

		// For now, just store as ISO string
		// In a real implementation, would use a date library to parse and format
		try {
			const date = new Date(value);
			return date.toISOString();
		} catch (e) {
			return String(value);
		}
	}
}

/**
 * GPS column implementation
 *
 * [NEW] Core class of the ColumnRep architecture
 * [INTENTION: Will solve GPS precision issues by storing coordinates as numbers with 7 decimal places]
 */
export class GpsColumnModel extends BaseColumnModel implements GpsColumn {
	type: 'gps' = 'gps';
	values: (GpsCoordinate | null)[] = [];
	format?: {
		gpsFormat?: 'DMS' | 'DD';
		precision?: number;
	};

	constructor(name: string, gpsFormat: 'DMS' | 'DD' = 'DD', precision: number = 7) {
		super(name);
		this.format = {
			gpsFormat: gpsFormat,
			precision: precision
		};
	}

	addValue(value: any): GpsCoordinate | null {
		const formattedValue = this.formatValue(value);
		this.values.push(formattedValue);
		this.isFormatted = true;
		return formattedValue;
	}

	formatValue(value: any): GpsCoordinate | null {
		if (value === null || value === undefined || value === '') return null;

		// Handle different input formats
		if (
			typeof value === 'object' &&
			value.latitude !== undefined &&
			value.longitude !== undefined
		) {
			// Already a GpsCoordinate object
			return this.formatGpsCoordinate(value);
		} else if (typeof value === 'string' && value.includes(',')) {
			// String in "lat,lon" format
			const [latStr, lonStr] = value.split(',');
			return this.formatGpsCoordinate({
				latitude: Number(latStr.trim()),
				longitude: Number(lonStr.trim())
			});
		} else {
			// Unsupported format
			console.warn(`Unsupported GPS format for value: ${value}`);
			return null;
		}
	}

	private formatGpsCoordinate(coord: GpsCoordinate): GpsCoordinate {
		const precision = this.format?.precision || 7;

		return {
			latitude: Number(Number(coord.latitude).toFixed(precision)),
			longitude: Number(Number(coord.longitude).toFixed(precision)),
			format: this.format?.gpsFormat || 'DD',
			precision: precision
		};
	}
}
