/**
 * Transformed Data Service
 * 
 * A simple service to store and retrieve transformed data between components.
 * This allows data to be passed from the Transform page to the TransPlant page.
 */

import { writable } from 'svelte/store';
import type { ColumnTypeMap } from '$lib/types/columnTypes';

// Store for the transformed data
const transformedData = writable<any[]>([]);

// Store for the column types
const columnTypes = writable<ColumnTypeMap>({});

// Store for the column headers
const headers = writable<string[]>([]);

// Store for toggled state of columns
const toggledColumns = writable<Record<string, boolean>>({});

// Exported service methods
export const transformedDataService = {
  // Set the transformed data
  setData: (data: any[]) => {
    console.log('transformedDataService: Setting data', data.length, 'rows');
    transformedData.set(data);
  },
  
  // Get the transformed data
  getData: () => {
    return transformedData;
  },
  
  // Set the column types
  setColumnTypes: (types: ColumnTypeMap) => {
    console.log('transformedDataService: Setting column types', types);
    columnTypes.set(types);
  },
  
  // Get the column types
  getColumnTypes: () => {
    return columnTypes;
  },
  
  // Set the headers
  setHeaders: (headerList: string[]) => {
    console.log('transformedDataService: Setting headers', headerList);
    headers.set(headerList);
  },
  
  // Get the headers
  getHeaders: () => {
    return headers;
  },
  
  // Set toggled state for columns
  setToggledColumns: (toggled: Record<string, boolean>) => {
    console.log('transformedDataService: Setting toggled columns', toggled);
    toggledColumns.set(toggled);
  },
  
  // Get toggled state for columns
  getToggledColumns: () => {
    return toggledColumns;
  },
  
  // Clear all data
  clearAll: () => {
    transformedData.set([]);
    columnTypes.set({});
    headers.set([]);
    toggledColumns.set({});
  }
};
