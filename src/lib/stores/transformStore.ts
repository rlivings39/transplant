// src/lib/stores/transformStore.ts
/**
 * Store for transformed data to be shared between Transform and TransPlant stages
 */

// Debug flag to control logging
const DEBUG = false;

// Logger utility for consistent and controlled logging
const logger = {
	debug: (message: string, ...args: any[]) => {
		if (DEBUG) console.log(`[TransformStore] ${message}`, ...args);
	},
	info: (message: string, ...args: any[]) => {
		console.log(`[TransformStore] ${message}`, ...args);
	},
	warn: (message: string, ...args: any[]) => {
		console.warn(`[TransformStore] ${message}`, ...args);
	},
	error: (message: string, ...args: any[]) => {
		console.error(`[TransformStore] ${message}`, ...args);
	}
};

// Simple variable to store the transformed data
let transformedData = null;
// Store for DOM-extracted data
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
		// Make a clean copy to avoid Svelte 5 proxy issues
		try {
			transformedData = JSON.parse(JSON.stringify(data));
			logger.debug('Transformed data set successfully');
		} catch (error) {
			logger.warn('Error creating clean copy, using direct assignment', error);
			transformedData = data; // Fallback to direct assignment if JSON fails
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
		logger.debug('Getting DOM-extracted data');
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
