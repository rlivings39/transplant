import { json } from '@sveltejs/kit';
import {
	extractSchemaMetadata,
	mapColumnTypes,
	getTableHeaders
} from '$lib/server/db/schemaMetadata';

export async function GET() {
	console.log('API: Schema metadata request received');

	try {
		// Extract schema metadata
		console.log('API: Extracting schema metadata...');
		const { tables, relationships } = extractSchemaMetadata();

		if (!tables || Object.keys(tables).length === 0) {
			console.error('API: No tables found in schema metadata');
			return json(
				{
					error: 'No tables found in schema metadata',
					tables: {},
					relationships: {},
					columnTypes: {},
					tableHeaders: {}
				},
				{ status: 500 }
			);
		}

		console.log(`API: Successfully extracted metadata for ${Object.keys(tables).length} tables`);

		// Map column types for the client
		console.log('API: Mapping column types...');
		const columnTypes = mapColumnTypes(tables);

		if (!columnTypes || Object.keys(columnTypes).length === 0) {
			console.error('API: Failed to map column types');
			return json(
				{
					error: 'Failed to map column types',
					tables,
					relationships,
					columnTypes: {},
					tableHeaders: {}
				},
				{ status: 500 }
			);
		}

		console.log('API: Successfully mapped column types');

		// Get table headers
		console.log('API: Getting table headers...');
		const tableHeaders = getTableHeaders(tables);

		if (!tableHeaders || Object.keys(tableHeaders).length === 0) {
			console.error('API: Failed to get table headers');
			return json(
				{
					error: 'Failed to get table headers',
					tables,
					relationships,
					columnTypes,
					tableHeaders: {}
				},
				{ status: 500 }
			);
		}

		console.log('API: Successfully got table headers');

		// Validate the response data
		const responseData = {
			tables,
			relationships,
			columnTypes,
			tableHeaders
		};

		// Log the response structure for debugging
		console.log('API: Schema response structure:', {
			tableCount: Object.keys(tables).length,
			relationshipCount: Object.keys(relationships).length,
			columnTypeCount: Object.keys(columnTypes).length,
			tableHeaderCount: Object.keys(tableHeaders).length
		});

		// Log sample data for the first table
		const firstTableName = Object.keys(tables)[0];
		if (firstTableName) {
			console.log(`API: Sample data for table ${firstTableName}:`, {
				columns: Object.keys(tables[firstTableName].columns).length,
				primaryKeys: tables[firstTableName].primaryKeys,
				columnTypes: columnTypes[firstTableName]
					? Object.keys(columnTypes[firstTableName]).length
					: 0,
				headers: tableHeaders[firstTableName] ? tableHeaders[firstTableName].length : 0
			});
		}

		return json(responseData);
	} catch (error) {
		console.error('API: Error generating schema metadata:', error);

		// Return a more detailed error response
		return json(
			{
				error: 'Failed to generate schema metadata',
				message: error.message || 'Unknown error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
}
