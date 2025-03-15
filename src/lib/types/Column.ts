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
