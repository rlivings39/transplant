/**
 * Utility functions for working with Column objects
 * 
 * This file provides functions for:
 * 1. Creating columns from raw data
 * 2. Converting between legacy and Column-based formats
 * 3. Detecting column types
 * 4. Validating column data
 */

import type { 
  Column, 
  StringColumn, 
  NumberColumn, 
  DateColumn, 
  GpsColumn,
  ColumnTypeMap,
  LegacyValidatedTransformData,
  ColumnBasedTransformData,
  GpsCoordinate
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
 */
export function createColumn(name: string, type: 'string' | 'number' | 'date' | 'gps'): Column {
  switch (type) {
    case 'string':
      return new StringColumnModel(name);
    case 'number':
      return new NumberColumnModel(name);
    case 'date':
      return new DateColumnModel(name);
    case 'gps':
      return new GpsColumnModel(name);
    default:
      return new StringColumnModel(name);
  }
}

/**
 * Create a column and populate it with values
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
    values.forEach(value => (stringColumn.values as (string | null)[]).push(
      value === null || value === undefined ? null : String(value)
    ));
  } else if (column.type === 'number') {
    const numberColumn = column as NumberColumn;
    values.forEach(value => {
      if (value === null || value === undefined || value === '') {
        numberColumn.values.push(null);
      } else {
        const num = Number(value);
        numberColumn.values.push(isNaN(num) ? null : num);
      }
    });
  } else if (column.type === 'date') {
    const dateColumn = column as DateColumn;
    values.forEach(value => {
      if (value === null || value === undefined || value === '') {
        dateColumn.values.push(null);
      } else {
        try {
          const date = new Date(value);
          dateColumn.values.push(date.toISOString());
        } catch (e) {
          dateColumn.values.push(String(value));
        }
      }
    });
  } else if (column.type === 'gps') {
    const gpsColumn = column as GpsColumn;
    values.forEach(value => {
      if (value === null || value === undefined || value === '') {
        gpsColumn.values.push(null);
      } else {
        try {
          // Handle different GPS formats
          if (typeof value === 'string' && value.includes(',')) {
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
 */
export function convertLegacyToColumnBased(legacy: LegacyValidatedTransformData): ColumnBasedTransformData {
  const columns: Column[] = [];
  
  // Get all unique column names
  const columnNames = Object.keys(legacy.columnTypes);
  
  // For each column name, create a column of the appropriate type
  columnNames.forEach(name => {
    const type = legacy.columnTypes[name];
    
    // Extract values for this column from all records
    const values = legacy.records.map(record => record[name]);
    
    // Create and add the column
    const column = createColumnWithValues(name, type, values);
    columns.push(column);
  });
  
  return { columns };
}

/**
 * Convert Column-based format to legacy format
 */
export function convertColumnBasedToLegacy(columnBased: ColumnBasedTransformData): LegacyValidatedTransformData {
  const records: Array<{ [key: string]: string | number | null }> = [];
  const columnTypes: { [key: string]: 'string' | 'number' | 'date' | 'gps' } = {};
  
  // Get all column names and types
  columnBased.columns.forEach(column => {
    columnTypes[column.name] = column.type;
  });
  
  // Determine the number of records
  const recordCount = Math.max(...columnBased.columns.map(col => {
    if (col.type === 'string') return (col as StringColumn).values.length;
    if (col.type === 'number') return (col as NumberColumn).values.length;
    if (col.type === 'date') return (col as DateColumn).values.length;
    if (col.type === 'gps') return (col as GpsColumn).values.length;
    return 0;
  }));
  
  // Create records
  for (let i = 0; i < recordCount; i++) {
    const record: { [key: string]: string | number | null } = {};
    
    // Add values from each column
    columnBased.columns.forEach(column => {
      if (column.type === 'string') {
        const values = (column as StringColumn).values;
        record[column.name] = i < values.length ? values[i] : null;
      } else if (column.type === 'number') {
        const values = (column as NumberColumn).values;
        record[column.name] = i < values.length ? values[i] : null;
      } else if (column.type === 'date') {
        const values = (column as DateColumn).values;
        record[column.name] = i < values.length ? values[i] : null;
      } else if (column.type === 'gps') {
        const values = (column as GpsColumn).values;
        const gpsValue = i < values.length ? values[i] : null;
        
        // Format GPS coordinates as strings for legacy format
        if (gpsValue) {
          record[column.name] = `${gpsValue.latitude},${gpsValue.longitude}`;
        } else {
          record[column.name] = null;
        }
      }
    });
    
    records.push(record);
  }
  
  return { records, columnTypes };
}

/**
 * Detect the type of a column based on its values
 */
export function detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'gps' {
  // Filter out null/undefined values
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) {
    return 'string'; // Default to string for empty columns
  }
  
  // Check if all values are numbers
  const allNumbers = nonNullValues.every(v => {
    const num = Number(v);
    return !isNaN(num);
  });
  
  if (allNumbers) {
    return 'number';
  }
  
  // Check if values look like GPS coordinates
  const gpsPattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
  const mightBeGps = nonNullValues.some(v => {
    if (typeof v !== 'string') return false;
    return gpsPattern.test(v) || parseGpsCoordinate(v) !== null;
  });
  
  if (mightBeGps) {
    return 'gps';
  }
  
  // Check if values are dates
  const mightBeDates = nonNullValues.every(v => {
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
 */
export function extractColumnFromRecords(
  records: Array<{ [key: string]: any }>, 
  columnName: string
): any[] {
  return records.map(record => record[columnName] || null);
}

/**
 * Create columns from records and column types
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
