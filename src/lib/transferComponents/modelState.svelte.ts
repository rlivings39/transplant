import type { ColumnRep } from '$lib/types/columnModel';

// This is the main program state. 
export let importedData = $state<{ columns: ColumnRep[] }>({ columns: [] });

// NEW PLAN: formattedData We need this. 24 Apr 2025  8:57 AM
//  open "file:///Users/chri sharris/Pictures/Monosnap/2025-04-24_09-00(1).png"



export function setImportedData(data: ColumnRep[]) {
	importedData.columns = data;
}
