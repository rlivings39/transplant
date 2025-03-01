// src/lib/stores/transformStore.js
/**
 * Store for transformed data to be shared between Transform and TransPlant stages
 */

// Simple variable to store the transformed data
let transformedData = null;

/**
 * Service to manage transformed data
 */
export const transformedDataService = {
	/**
	 * Set the transformed data
	 * @param {Object} data - The transformed data to store
	 */
	set: function (data) {
		console.log('transformStore: Setting data', data);

		// Make a clean copy to avoid Svelte 5 proxy issues
		try {
			transformedData = JSON.parse(JSON.stringify(data));
			console.log('transformStore: Data set successfully', transformedData);
		} catch (error) {
			console.error('transformStore: Error setting data', error);
			transformedData = data; // Fallback to direct assignment if JSON fails
		}
	},

	/**
	 * Get the transformed data (primary method)
	 * @returns {Object|null} The transformed data or null if not set
	 */
	get: function () {
		console.log('transformStore: Getting data via get()', transformedData);
		return transformedData;
	},

	/**
	 * Alternative method to get the transformed data (for compatibility)
	 * @returns {Object|null} The transformed data or null if not set
	 */
	getData: function () {
		console.log('transformStore: Getting data via getData()', transformedData);
		return transformedData;
	},

	/**
	 * Clear the transformed data
	 */
	clear: function () {
		console.log('transformStore: Clearing data');
		transformedData = null;
	}
};
