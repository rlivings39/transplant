// src/lib/stores/transformStore.ts	
/**
 * Store for transformed data to be shared between Transform and TransPlant stages
 */

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
		// // console.log('transformStore: Setting data', data);

		// Make a clean copy to avoid Svelte 5 proxy issues
		try {
			transformedData = JSON.parse(JSON.stringify(data));
			// // console.log('transformStore: Data set successfully', transformedData);
		} catch (error) {
			// console.error('transformStore: Error setting data', error);
			transformedData = data; // Fallback to direct assignment if JSON fails
		}
	},

	/**
	 * Set the DOM-extracted data
	 * @param {Object} data - The DOM-extracted data to store
	 */
	setDomExtractedData: function (data) {
		console.log('transformStore: Setting DOM-extracted data', data);

		// Make a clean copy to avoid Svelte 5 proxy issues
		try {
			domExtractedData = JSON.parse(JSON.stringify(data));
			console.log('transformStore: DOM-extracted data set successfully', domExtractedData);
		} catch (error) {
			console.error('transformStore: Error setting DOM-extracted data', error);
			domExtractedData = data; // Fallback to direct assignment if JSON fails
		}
	},

	/**
	 * Get the transformed data (primary method)
	 * @returns {Object|null} The transformed data or null if not set
	 */
	get: function () {
		// // console.log('transformStore: Getting data via get()', transformedData);
		return transformedData;
	},

	/**
	 * Get the DOM-extracted data
	 * @returns {Object|null} The DOM-extracted data or null if not set
	 */
	getDomExtractedData: function () {
		console.log('transformStore: Getting DOM-extracted data', domExtractedData);
		return domExtractedData;
	},

	/**
	 * Alternative method to get the transformed data (for compatibility)
	 * @returns {Object|null} The transformed data or null if not set
	 */
	getData: function () {
		// // console.log('transformStore: Getting data via getData()', transformedData);
		return transformedData;
	},

	/**
	 * Clear the transformed data
	 */
	clear: function () {
		// // console.log('transformStore: Clearing data');
		transformedData = null;
		domExtractedData = null;
	}
};
