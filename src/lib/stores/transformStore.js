// src/lib/stores/transformStore.js
import { writable } from 'svelte/store';

console.log('Initializing transform store');

// Create the store
export const transformedData = writable(null);
// Service to handle transformed data
export const transformedDataService = {
    // Save data to the store
    set(data) {
        transformedData.set(data);
        console.log('Data saved to transformedData store');
    },
    
    // Get data from the store
    getData() {
        let result = null;
        transformedData.subscribe(value => {
            result = value;
        })();
        return result;
    },
    
    // Clear data from the store
    clear() {
        transformedData.set(null);
    }
};
