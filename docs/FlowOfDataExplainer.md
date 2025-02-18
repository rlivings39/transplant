// 1. ENTRY POINT: Handles CSV file upload and parsing using PapaParse
// 2. Uses PapaParse to convert CSV to array of objects
// 3. CENTRAL STATE MANAGER: Holds the main application state
// 4. Maintains both the CSV data and column type information
	    // 5. Receives parsed data from CsvImporter and updates central state
// 6. DATA Trasnformer: recieves data and columnTypes as props from page.svelte
// 7. Will transform the data based on the specified column types
// 8. Reactively transforms data whenever data or columnTypes change
// 9.