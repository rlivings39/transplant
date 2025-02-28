// src/lib/stores/transformStore.js
import { writable } from 'svelte/store';

console.log('Initializing transform store');

// Create the store
export const transformedData = writable(null);

// Function to save a copy of the data
export function saveTransformedData(data) {
	console.log('Saving transformed data to store:', data);

	if (!data) {
		console.warn('Attempted to save null/undefined data to store');
		return;
	}

	if (!data.records || !Array.isArray(data.records)) {
		console.warn('Data is missing records array:', data);
		return;
	}

	// Save a deep copy to avoid reference issues
	const dataCopy = JSON.parse(JSON.stringify(data));

	// Save directly to localStorage first (synchronously)
	try {
		console.log('Saving directly to localStorage...');
		localStorage.setItem('transformedData', JSON.stringify(dataCopy));
		console.log('localStorage save complete');
	} catch (e) {
		console.error('Error saving to localStorage:', e);
	}

	// Then update the store
	console.log('Updating store...');
	transformedData.set(dataCopy);
}

// Function to load data from localStorage
export function loadTransformedData() {
	console.log('Loading transformed data from localStorage');
	try {
		const stored = localStorage.getItem('transformedData');
		if (stored) {
			const parsed = JSON.parse(stored);
			console.log('Found data in localStorage, loading into store');
			transformedData.set(parsed);
			return parsed;
		} else {
			console.log('No data found in localStorage');
			return null;
		}
	} catch (e) {
		console.error('Error loading from localStorage:', e);
		return null;
	}
}

// Function to clear the data
export function clearTransformedData() {
	console.log('Clearing transformed data');
	transformedData.set(null);
	localStorage.removeItem('transformedData');
}
