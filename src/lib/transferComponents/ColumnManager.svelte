<script lang="ts">
    import type { ColumnRep } from '$lib/types/columnModel';
    import { validateNumber } from '$lib/utils/DetectValidFormat/numberType';
import { validateDate } from '$lib/utils/DetectValidFormat/dateType';
import { validateGps } from '$lib/utils/DetectValidFormat/gpsType';
    
    // Type guards for type-safe column operations
    function isNumberColumn(column: ColumnRep): column is numberType.NumberColumn {
      return column.type === 'number';
    }
 
    
    function createColumn(headerName: string): ColumnRep {
  return {
    headerName,
    type: 'number',
    values: [],
    validationErrors: new Set()
  };
}
function validateColumn(column: ColumnRep): boolean {
  return column.values.every(v => validateNumber(v));
}
    </script>