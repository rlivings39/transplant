import type { ColumnRep } from '$lib/types/columnModel';

// This is the main program state. 
export let importedData = $state<{ columns: ColumnRep[] }>({ columns: [] });

export function setImportedData(data: ColumnRep[]) {
	importedData.columns = data;
}
