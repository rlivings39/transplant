import { json } from '@sveltejs/kit';
import {
	extractSchemaMetadata,
	mapColumnTypes,
	getTableHeaders
} from '$lib/server/db/schemaMetadata';

export async function GET() {
	try {
		// Extract schema metadata
		const { tables, relationships } = extractSchemaMetadata();

		// Map column types for the client
		const columnTypes = mapColumnTypes(tables);

		// Get table headers
		const tableHeaders = getTableHeaders(tables);

		return json({
			tables,
			relationships,
			columnTypes,
			tableHeaders
		});
	} catch (error) {
		console.error('Error generating schema metadata:', error);
		return json({ error: 'Failed to generate schema metadata' }, { status: 500 });
	}
}
