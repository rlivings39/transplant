// src/lib/stores/transformStore.ts
/**
 * Store for transformed data to be shared between Transform and TransPlant stages
 */

// Debug flag to control logging
const DEBUG = true;

// Simple logger with reduced output
const logger = {
	debug: function (message, ...args) {
		// Only log important messages
		if (message.includes('Setting') || message.includes('Error')) {
			console.log('[TransformStore]', message);
		}
	},
	error: function (message, ...args) {
		console.error('[TransformStore]', message, ...args);
	}
};

// Store for transformed data
let transformedData = null;
let domExtractedData = null;

/**
 * Service to manage transformed data
 */
export const transformedDataService = {
	/**
	 * Set the transformed data
	 * @param {Object} data - The transformed data to store
	 */
	set: function (data) {
		logger.debug('Setting transformed data');

		if (!data) {
			transformedData = null;
			return;
		}

		try {
			// Create a deep copy while preserving number types for GPS data
			const processedData = {
				records: data.records.map((record) => {
					const newRecord = {};
					// Process each field in the record
					Object.entries(record).forEach(([key, value]) => {
						// Handle GPS coordinates (string with comma)
						if (
							data.columnTypes[key] === 'gps' &&
							typeof value === 'string' &&
							value.includes(',')
						) {
							// Store as a formatted string with consistent precision
							newRecord[key] = value;
							return;
						}

						// Handle regular numbers
						if (data.columnTypes[key] === 'number' && typeof value === 'string') {
							const num = Number(value);
							if (!isNaN(num)) {
								newRecord[key] = num;
								return;
							}
						}

						// Default case: pass through as is
						newRecord[key] = value;
					});
					return newRecord;
				}),
				columnTypes: { ...data.columnTypes }
			};

			transformedData = processedData;
			logger.debug('Transformed data processed and set successfully');
		} catch (error) {
			logger.error('Error processing data', error);
			// Fallback to direct assignment
			transformedData = data;
		}
	},

	/**
	 * Set the DOM-extracted data
	 * @param {Object} data - The DOM-extracted data to store
	 */
	setDomExtractedData: function (data) {
		logger.debug('Setting DOM-extracted data');

		// Make a clean copy to avoid Svelte 5 proxy issues
		try {
			domExtractedData = JSON.parse(JSON.stringify(data));
			logger.debug('DOM-extracted data set successfully');
		} catch (error) {
			logger.error('Error setting DOM-extracted data', error);
			domExtractedData = data; // Fallback to direct assignment if JSON fails
		}
	},

	/**
	 * Get the transformed data (primary method)
	 * @returns {Object|null} The transformed data or null if not set
	 */
	get: function () {
		return transformedData;
	},

	/**
	 * Get the DOM-extracted data
	 * @returns {Object|null} The DOM-extracted data or null if not set
	 */
	getDomExtractedData: function () {
		return domExtractedData;
	},

	/**
	 * Alternative method to get the transformed data (for compatibility)
	 * @returns {Object|null} The transformed data or null if not set
	 */
	getData: function () {
		return transformedData;
	},

	/**
	 * Clear all stored data
	 */
	clear: function () {
		transformedData = null;
		domExtractedData = null;
		logger.debug('All transform data cleared');
	}
};
