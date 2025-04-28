import { db } from '$lib/server/db';
import { land, planting, crop } from '$lib/server/db/schema';
import type { PgTableWithColumns } from 'drizzle-orm/pg-core';

export async function load() {
	if (db) {
		const landsDbTable = await db.select().from(land).limit(1);
		const plantingDbTable = await db.select().from(planting).limit(1);
		const cropDbTable = await db.select().from(crop).limit(1

		);
		// console.log(land.gpsLat.columnType);
		const dbFormat = dbFormatSelector(land);
		const plantingDbFormat = dbFormatSelector(planting);
		const cropDbFormat = dbFormatSelector(crop);
		console.log('dbFormat', dbFormat);
		return { landsDbTable, plantingDbTable, cropDbTable, dbFormat };
	} else {
		const exEntry = {column_1: 1, column_2: 2};
		const exData = [exEntry, exEntry, exEntry];
		const exFormat = {column_1: 'number', colunn_2: 'string'};
		return {landsDbTable: exData, plantingDbTable: exData, cropDbTable: exData, dbFormat: exFormat};
	}

}

interface ColumnDescription {
	columnType:
		| 'PgNumeric'
		| 'PgDate'
		| 'PgUUID'
		| 'PgText'
		| 'PgTimestampString'
		| 'PgBoolean'
		| 'PgEnumColumn'
		| 'PgBigInt53';
	// Add other properties if they exist
}

// 🌲️🌲️🌲️🌲️🌲️🌲️🌲️🌲️ Selector Types for db table 🌲️🌲️🌲️🌲️
function dbFormatSelector(table: PgTableWithColumns<any>) {
	let columnFormats: Record<string, string> = {};
	for (const [columnName, column] of Object.entries(table)) {
		if (column && typeof column === 'object' && 'columnType' in column) {
			const columnDescription = column as ColumnDescription;
			let format = 'string';
			if (columnDescription.columnType === 'PgNumeric') {
				format = 'number';
			} else if (columnDescription.columnType === 'PgDate') {
				format = 'date';
			} else if (columnDescription.columnType === 'PgUUID') {
				format = 'string';
			} else if (columnDescription.columnType === 'PgText') {
				format = 'string';
			} else if (columnDescription.columnType === 'PgTimestampString') {
				format = 'date';
			} else if (columnDescription.columnType === 'PgBoolean') {
				format = 'string';
			} else if (columnDescription.columnType === 'PgEnumColumn') {
				format = 'string';
			} else if (columnDescription.columnType === 'PgBigInt53') {
				format = 'number';
			}
			columnFormats[columnName] = format;
		}
	}
	return columnFormats;
}
