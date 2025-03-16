<script lang="ts">
    import type { ColumnRep } from '$lib/types/columnModel';
    import * as numberType from '$lib/utils/DetectValidFormat/numberType';
    import * as dateType from '$lib/utils/DetectValidFormat/dateType';
    import * as gpsType from '$lib/utils/DetectValidFormat/gpsType';
    
    // Type guards for type-safe column operations
    function isNumberColumn(column: ColumnRep): column is numberType.NumberColumn {
      return column.type === 'number';
    }
    
    function isDateColumn(column: ColumnRep): column is dateType.DateColumn {
      return column.type === 'date';
    }
    
    function isGpsColumn(column: ColumnRep): column is gpsType.GpsColumn {
      return column.type === 'gps';
    }
    
    // Create a new column with type-specific properties
    export function createColumn(headerName: string, type: string): ColumnRep {
      const baseColumn: ColumnRep = {
        headerName,
        type,
        values: [],
        isToggled: false,
        isFormatted: false
      };
    
      switch (type) {
        case 'number':
          return {
            ...baseColumn,
            format: { precision: 2 },
            validation: { min: undefined, max: undefined }
          } as numberType.NumberColumn;
        case 'date':
          return {
            ...baseColumn,
            format: { timezone: 'UTC' }
          } as dateType.DateColumn;
        case 'gps':
          return {
            ...baseColumn,
            format: { precision: 7 }
          } as gpsType.GpsColumn;
        default:
          return baseColumn;
      }
    }
    
    // Validate all values in a column
    export function validateColumn(column: ColumnRep): boolean {
      if (!column.values) return false;
      
      switch (column.type) {
        case 'number':
          if (!isNumberColumn(column)) return false;
          return column.values.every(value => 
            value === null || numberType.validateNumber(String(value))
          );
        case 'date':
          if (!isDateColumn(column)) return false;
          return column.values.every(value =>
            value === null || dateType.validateDate(String(value))
          );
        case 'gps':
          if (!isGpsColumn(column)) return false;
          return column.values.every(value =>
            value === null || gpsType.validateGps(String(value))
          );
        case 'string':
          return true;
        default:
          return false;
      }
    }
    </script>