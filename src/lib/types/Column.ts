/**
 * Column.ts - Core data structure for the Column-based architecture
 * 
 * This interface represents a column as a cohesive entity that binds together
 * the column name, type, values, formatting information, and UI state.
 */

// Import the ValidatedTransformData interface for use in TransformManager
export interface ValidatedTransformData {
  records: Array<{
    [key: string]: string | number | null;
  }>;
  columnTypes: {
    [key: string]: 'string' | 'number' | 'date' | 'gps';
  };
  toggledColumns: {
    [key: string]: boolean;
  };
}

export interface Column {
  /** The column name/header from the imported data */
  name: string;
  type: 'string' | 'number' | 'date' | 'gps';
  
  /** The actual data values for this column */
  values: Array<string | number | null>;
  
  /** Whether the values have been formatted according to their type */
  isFormatted: boolean;
  
  /** Whether the column is toggled off (hidden) in the UI */
  isToggled: boolean;
  
  /** Optional validation errors by row index */
  validationErrors?: Set<number>;
}

/**
 * Interface for column mapping information
 */
export interface ColumnMapping {
  /** Source column name from imported data */
  sourceColumn: string;
  
  /** Target field name in the database schema */
  targetField: string;
  
  /** Target table name in the database schema */
  targetTable: string;
}
