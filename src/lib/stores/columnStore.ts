/**
 * Store for column-based data to be shared between Transfer and TransPlant stages
 * 
 * This store is specifically designed to handle Column objects properly,
 * ensuring type consistency and preserving formatting information.
 */

import type { Column, ColumnBasedTransformData } from '$lib/types/columnTypes';
import { updateCellValidationStates } from '$lib/utils/columnUtils';

// Debug flag to control logging
const DEBUG = true;

// Logger utility for consistent and controlled logging
const logger = {
	debug: (message: string, ...args: any[]) => {
		if (DEBUG) console.log(`[ColumnStore] ${message}`, ...args);
	},
	info: (message: string, ...args: any[]) => {
		console.log(`[ColumnStore] ${message}`, ...args);
	},
	warn: (message: string, ...args: any[]) => {
		console.warn(`[ColumnStore] ${message}`, ...args);
	},
	error: (message: string, ...args: any[]) => {
		console.error(`[ColumnStore] ${message}`, ...args);
	}
};

// Store for column-based data
let columnData: ColumnBasedTransformData | null = null;

/**
 * Service to manage column-based data
 */
export const columnStore = {
	/**
	 * Set the column-based data
	 * @param {ColumnBasedTransformData} data - The column-based data to store
	 */
	set: function(data: ColumnBasedTransformData | null) {
		logger.info('Setting column-based data');

		if (!data) {
			columnData = null;
			return;
		}

		try {
			// Process each column to ensure proper validation states
			const processedColumns = data.columns.map(column => {
				// Update cell validation states
				return updateCellValidationStates(column);
			});

			// Create a new object to avoid reference issues
			columnData = {
				columns: processedColumns
			};

			logger.debug(`Stored ${processedColumns.length} columns`);
		} catch (error) {
			logger.error('Error setting column data:', error);
			columnData = null;
		}
	},

	/**
	 * Get the column-based data
	 * @returns {ColumnBasedTransformData|null} The column-based data or null if not set
	 */
	get: function(): ColumnBasedTransformData | null {
		return columnData;
	},

	/**
	 * Get a specific column by name
	 * @param {string} columnName - The name of the column to get
	 * @returns {Column|null} The column or null if not found
	 */
	getColumn: function(columnName: string): Column | null {
		if (!columnData) return null;
		return columnData.columns.find(col => col.name === columnName) || null;
	},

	/**
	 * Update a specific column
	 * @param {string} columnName - The name of the column to update
	 * @param {Column} updatedColumn - The updated column
	 */
	updateColumn: function(columnName: string, updatedColumn: Column): void {
		if (!columnData) return;

		const columnIndex = columnData.columns.findIndex(col => col.name === columnName);
		if (columnIndex === -1) return;

		// Update the column
		columnData.columns[columnIndex] = updatedColumn;
		
		logger.debug(`Updated column: ${columnName}`);
	},

	/**
	 * Clear all stored data
	 */
	clear: function() {
		columnData = null;
		logger.info('Cleared column data');
	}
};
