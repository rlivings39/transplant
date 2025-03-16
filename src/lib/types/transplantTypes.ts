export interface ColumnMapping {
    /** Source column name from imported data */
    sourceColumn: string;
    
    /** Target field name in the database schema */
    targetField: string;
    
    /** Target table name in the database schema */
    targetTable: string;
  }